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
    },
    {
      name: 'storage-app-client',
      cwd: '/var/www/storage-app-client',
      script: './node_modules/.bin/http-server',
      args: 'dist -p 3001 -a 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/storage-app-client-error.log',
      out_file: '/var/log/pm2/storage-app-client-out.log',
      log_file: '/var/log/pm2/storage-app-client-combined.log',
      time: true
    }
  ]
}; 