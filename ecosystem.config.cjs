// pm2 ecosystem for OJ-Tracker (backend + static on port 80)
module.exports = {
  apps: [{
    name: 'oj-tracker',
    script: 'node_modules/.bin/tsx',
    args: 'api/server.ts',
    cwd: '.',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
      PORT: 80,
      SERVE_STATIC: '1',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }],
}
