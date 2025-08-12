module.exports = {
  apps: [{
    name: 'easycashflows',
    script: 'tsx',
    args: 'server/index.ts',
    cwd: '/var/www/easycashflows',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/easycashflows/error.log',
    out_file: '/var/log/easycashflows/out.log',
    log_file: '/var/log/easycashflows/combined.log',
    time: true
  }]
};