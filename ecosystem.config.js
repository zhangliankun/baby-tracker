// PM2 进程管理配置 — 婴儿喂养记录 App
// 使用方法：pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'baby-tracker',
      script: './backend/index.js',
      cwd: '/opt/baby-tracker',

      // 内存限制
      max_memory_restart: '800M',
      node_args: '--max-old-space-size=512',

      // 日志
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/baby-tracker/error.log',
      out_file: '/var/log/baby-tracker/out.log',
      merge_logs: true,

      // 重启策略
      autorestart: true,
      max_restarts: 50,
      restart_delay: 5000,
      kill_timeout: 10000,

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // 实例数（单实例，SQLite 不支持多进程写入）
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
