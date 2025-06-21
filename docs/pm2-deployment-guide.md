# PM2 Deployment Guide - Storage App

This guide covers the complete setup and deployment of the Storage App using PM2 for process management and Apache as a reverse proxy.

## 📋 Prerequisites

- Node.js and npm installed
- PM2 installed globally: `npm install -g pm2`
- MongoDB running and accessible
- Both client and server applications built and ready
- Apache2 installed and configured

## 🏗️ Project Structure

```
/var/www/
├── storage-app-client/     # React client (built files)
│   ├── dist/              # Production build
│   ├── package.json       # Client dependencies
│   └── node_modules/      # Client node modules
├── storage-app-server/     # Express server
│   ├── dist/              # Compiled TypeScript
│   ├── src/               # Source code
│   ├── package.json       # Server dependencies
│   └── node_modules/      # Server node modules
├── ecosystem.config.js     # PM2 configuration
└── docs/                  # Documentation
```

## 🚀 Deployment Steps

### 1. Prepare the Server Application

```bash
cd /var/www/storage-app-server

# Install dependencies
npm install

# Build the application
npm run build

# Verify the build
ls -la dist/
```

### 2. Prepare the Client Application

```bash
cd /var/www/storage-app-client

# Initialize package.json if not exists
npm init -y

# Install http-server for serving static files (optional, if not using Apache)
npm install http-server

# Verify the dist folder exists
ls -la dist/
```

### 3. Create PM2 Ecosystem Configuration

Create `/var/www/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'storage-app-server',
      cwd: '/var/www/storage-app-server',
      script: 'dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 16788
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 16788
      },
      error_file: '/var/log/pm2/storage-app-server-error.log',
      out_file: '/var/log/pm2/storage-app-server-out.log',
      log_file: '/var/log/pm2/storage-app-server-combined.log',
      time: true
    }
  ]
};
```

### 4. Apache Reverse Proxy Configuration

Edit `/etc/apache2/sites-available/termoparotto.micro-cloud.it.conf`:

```
<VirtualHost *:80>
    ServerName termoparotto.micro-cloud.it
    ServerAlias www.termoparotto.micro-cloud.it
    ServerAdmin helpdesk@micro-web.it
    DocumentRoot /var/www/storage-app-client/dist

    <Directory /var/www/storage-app-client/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>

    ProxyPass /api http://localhost:16788/api
    ProxyPassReverse /api http://localhost:16788/api

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

Enable required Apache modules and reload:

```bash
sudo a2enmod proxy proxy_http
sudo systemctl reload apache2
```

### 5. Setup Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log/pm2

# Set proper permissions
sudo chown microweb:microweb /var/log/pm2
```

### 6. Start Applications with PM2

```bash
cd /var/www

# Start the server application
pm2 start ecosystem.config.js --update-env

# Save the configuration for persistence
pm2 save

# Check status
pm2 status
```

## 🔧 PM2 Management Commands

### Basic Commands

```bash
# Check status of all applications
pm2 status

# View logs (all applications)
pm2 logs

# View logs for specific application
pm2 logs storage-app-server
pm2 logs storage-app-client

# Restart applications
pm2 restart all
pm2 restart storage-app-server
pm2 restart storage-app-client

# Stop applications
pm2 stop all
pm2 stop storage-app-server
pm2 stop storage-app-client

# Start applications
pm2 start all
pm2 start storage-app-server
pm2 start storage-app-client

# Delete applications from PM2
pm2 delete all
pm2 delete storage-app-server
pm2 delete storage-app-client
```

### Advanced Commands

```bash
# Monitor resources in real-time
pm2 monit

# Show detailed information
pm2 show storage-app-server
pm2 show storage-app-client

# Reload applications (zero-downtime)
pm2 reload all

# Update PM2 startup script
pm2 startup

# Save current process list
pm2 save

# Resurrect saved processes
pm2 resurrect
```

## 📊 Monitoring and Logs

### Log Locations

- **Server logs**: `/var/log/pm2/storage-app-server-*.log`
- **Client logs**: `/var/log/pm2/storage-app-client-*.log`
- **PM2 logs**: `/home/microweb/.pm2/pm2.log`

### View Logs

```bash
# View all logs
pm2 logs

# View specific application logs
pm2 logs storage-app-server --lines 50
pm2 logs storage-app-client --lines 50

# Follow logs in real-time
pm2 logs --follow

# View log files directly
tail -f /var/log/pm2/storage-app-server-out.log
tail -f /var/log/pm2/storage-app-client-out.log
```

## 🔄 Updating Applications

### Server Updates

```bash
cd /var/www/storage-app-server

# Pull latest changes (if using git)
git pull origin main

# Install new dependencies
npm install

# Rebuild the application
npm run build

# Restart the server
pm2 restart storage-app-server
```

### Client Updates

```bash
# Deploy new build files to /var/www/storage-app-client/dist/
# Then restart the client
pm2 restart storage-app-client
```

## 🌐 Access Points

- **Client Application**: http://termoparotto.micro-cloud.it
- **Server API**: http://termoparotto.micro-cloud.it/api/
- **API Endpoints**:
  - Authentication: `/api/auth`
  - Products: `/api/products`
  - Users: `/api/users`
  - Clients: `/api/clients`
  - Reports: `/api/reports`
  - Worksites: `/api/worksites`

## 🔒 Environment Configuration

### Server Environment Variables

Create `.env.remote` in `/var/www/storage-app-server/`:

```env
NODE_ENV=production
PORT=16788
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://termoparotto.micro-cloud.it
```

### Client Configuration

Ensure the client is configured to connect to `/api` endpoints relative to the main domain (no port in production).

## 🚨 Troubleshooting

- Always access the app and API via `http://termoparotto.micro-cloud.it` (not with :16788 in the URL)
- If you get a 503, check that PM2 is running the server on port 16788 and Apache is proxying correctly.
- Use `pm2 logs` and Apache logs for debugging.

## 📈 Performance Monitoring

### Memory and CPU Usage

```bash
# Monitor in real-time
pm2 monit

# Get detailed stats
pm2 show storage-app-server
pm2 show storage-app-client
```

### Scaling (if needed)

```bash
# Scale server to multiple instances
pm2 scale storage-app-server 2

# Scale client (usually not needed for static files)
pm2 scale storage-app-client 1
```

## 🔄 Auto-restart on Server Reboot

PM2 will automatically restart your applications when the server reboots because we saved the configuration with `pm2 save`.

To verify:
```bash
# Check if startup script is configured
pm2 startup

# If not configured, run:
pm2 startup
# Then follow the instructions provided
```

## ✅ Verification Checklist

- [ ] Server builds successfully (`npm run build`)
- [ ] Client dist folder exists with built files
- [ ] PM2 ecosystem.config.js is created
- [ ] Log directory exists with proper permissions
- [ ] Both applications start without errors
- [ ] Applications are accessible on their respective ports
- [ ] PM2 configuration is saved (`pm2 save`)
- [ ] Applications restart automatically after server reboot

## 📞 Support

If you encounter issues:

1. Check the logs: `pm2 logs`
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check file permissions
5. Verify MongoDB connection

---

**Last Updated**: June 21, 2025
**Version**: 1.0.1 