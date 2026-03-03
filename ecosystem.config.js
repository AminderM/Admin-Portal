module.exports = {
  apps: [
    {
      name: 'admin-portal-staging',
      script: 'npx',
      args: 'serve -s /var/www/admin-portal/build -l 3001',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      cwd: '/var/www/admin-portal',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/www/admin-portal/logs/pm2-error.log',
      out_file: '/var/www/admin-portal/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

