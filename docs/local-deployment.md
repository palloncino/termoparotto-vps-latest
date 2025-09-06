# Local Deployment Guide

**This is the second documentation file created today for local deployments of the Termoparotto application.**

This guide covers how to set up and run both the client (React frontend) and server (Node.js backend) components locally for development and testing purposes.

## Prerequisites

Before starting, ensure you have the following installed on your local machine:

- **Node.js** (v18 or higher)
- **Yarn** package manager
- **Git** for version control
- **MongoDB** (local instance or MongoDB Atlas connection)
- **TypeScript** (will be installed via dependencies)

## Project Structure

```
termoparotto/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── deploy-client.sh # Client deployment script
├── deploy-server.sh # Server deployment script
└── docs/           # Documentation files
```

## Server Setup

### 1. Install Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the server directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/termoparotto
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (for local development)
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

Ensure MongoDB is running locally or configure your MongoDB Atlas connection.

### 4. Start the Server

For development mode:
```bash
yarn dev
```

For production mode:
```bash
yarn start
```

The server will start on `http://localhost:3001`

### 5. Verify Server Status

Check if the server is running by visiting:
- `http://localhost:3001/health` (if health endpoint exists)
- `http://localhost:3001/api/` (API base endpoint)

## Client Setup

### 1. Install Dependencies

Navigate to the client directory and install dependencies:

```bash
cd client
yarn install
```

### 2. Environment Configuration

Create a `.env` file in the client directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# App Configuration
VITE_APP_NAME=Termoparotto
VITE_APP_VERSION=1.0.0
```

### 3. Start the Client

For development mode:
```bash
yarn dev
```

The client will start on `http://localhost:5173`

### 4. Build for Production

To create a production build:
```bash
yarn build
```

This will create a `dist` folder with optimized static files.

## Development Workflow

### 1. Starting Both Applications

**Terminal 1 - Server:**
```bash
cd server
yarn dev
```

**Terminal 2 - Client:**
```bash
cd client
yarn dev
```

### 2. Hot Reload

Both applications support hot reload:
- Server: Uses `ts-node` for TypeScript compilation
- Client: Uses Vite for fast development builds

### 3. API Testing

Test API endpoints using tools like:
- **Postman**
- **Insomnia**
- **cURL** commands
- **Browser Developer Tools**

## Common Issues and Solutions

### 1. Port Conflicts

If ports are already in use:

**Server (default: 3001):**
```bash
# Check what's using port 3001
lsof -i :3001
# Kill the process or change PORT in .env
```

**Client (default: 5173):**
```bash
# Vite will automatically find the next available port
# or specify in vite.config.ts
```

### 2. MongoDB Connection Issues

**Local MongoDB:**
```bash
# Start MongoDB service
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

**MongoDB Atlas:**
- Ensure IP whitelist includes your local IP
- Check connection string format
- Verify username/password

### 3. CORS Issues

If you encounter CORS errors, ensure the server's CORS configuration includes your client URL:

```typescript
// In server/src/app.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

### 4. TypeScript Compilation Errors

**Server:**
```bash
cd server
yarn lint          # Check for linting issues
yarn build         # Compile TypeScript
```

**Client:**
```bash
cd client
yarn lint          # Check for linting issues
yarn build         # Build for production
```

## Production Deployment Preparation

### 1. Server Production Build

```bash
cd server
yarn build         # Compile TypeScript to JavaScript
yarn start         # Start production server
```

### 2. Client Production Build

```bash
cd client
yarn build         # Create optimized build in dist/
```

### 3. Environment Files

For production deployment, ensure you have:
- `server/.env.remote` - Production environment variables
- Proper database connections
- Secure JWT secrets
- Correct CORS origins

## Monitoring and Logs

### 1. Server Logs

Monitor server logs in real-time:
```bash
# If using PM2
pm2 logs storage-app-server

# Direct logs
cd server && yarn dev
```

### 2. Client Logs

Client logs appear in:
- Browser Developer Console
- Terminal where `yarn dev` is running

### 3. Database Logs

Monitor MongoDB logs:
```bash
# Local MongoDB
tail -f /var/log/mongodb/mongod.log

# MongoDB Atlas
# Check Atlas dashboard for connection logs
```

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files to version control
- Use different secrets for development and production
- Regularly rotate JWT secrets

### 2. Database Security

- Use strong passwords for database connections
- Enable authentication for local MongoDB
- Use connection strings with proper authentication

### 3. API Security

- Implement proper input validation
- Use HTTPS in production
- Set up proper CORS policies

## Troubleshooting

### 1. Dependency Issues

```bash
# Clear yarn cache
yarn cache clean

# Remove node_modules and reinstall
rm -rf node_modules
yarn install
```

### 2. TypeScript Issues

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript
yarn upgrade typescript
```

### 3. Build Issues

```bash
# Clear build cache
rm -rf dist/
rm -rf build/

# Rebuild
yarn build
```

## Next Steps

After successful local deployment:

1. **Test all features** - Ensure all functionality works as expected
2. **Run linting** - Fix any code quality issues
3. **Test API endpoints** - Verify all endpoints return correct responses
4. **Check database operations** - Ensure CRUD operations work properly
5. **Prepare for production** - Update environment variables and configurations

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Note:** This documentation is specifically for local development and testing. For production deployment, refer to the VPS deployment scripts (`deploy-client.sh` and `deploy-server.sh`) and the VPS documentation. 