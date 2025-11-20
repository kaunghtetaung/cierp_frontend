module.exports = {
  apps: [
    {
      name: 'core',
      cwd: './apps/core',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/core-error.log',
      out_file: './logs/core-out.log',
      log_file: './logs/core-combined.log',
      time: true
    },
    {
      name: 'publicweb',
      cwd: './apps/publicWeb',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/publicweb-error.log',
      out_file: './logs/publicweb-out.log',
      log_file: './logs/publicweb-combined.log',
      time: true
    }
  ]
};