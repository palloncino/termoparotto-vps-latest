module.exports = {
  apps: [
    {
      name: 'termoparotto-server',
      cwd: '/var/www/termoparotto/server',
      script: 'dist/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 1669
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 1669
      },
      error_file: '/var/log/pm2/termoparotto-server-error.log',
      out_file: '/var/log/pm2/termoparotto-server-out.log',
      log_file: '/var/log/pm2/termoparotto-server-combined.log',
      time: true
    },
    {
      name: 'termoparotto-client',
      cwd: '/var/www/termoparotto/client',
      script: './node_modules/.bin/http-server',
      args: 'dist -p 16788 -a 0.0.0.0',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 16788
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 16788
      },
      error_file: '/var/log/pm2/termoparotto-client-error.log',
      out_file: '/var/log/pm2/termoparotto-client-out.log',
      log_file: '/var/log/pm2/termoparotto-client-combined.log',
      time: true
    }
  ]
}; 