module.exports = {
  apps: [
    {
      name: 'tavernai-dev',
      script: 'npm',
      args: 'run dev',
      cwd: '/Users/lu/Documents/jiuguanbaba/cankao/tavernai-plus',
      env: {
        NODE_ENV: 'development',
        PORT: 3007
      },
      // 自动重启配置
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s',

      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 进程配置
      instances: 1,
      exec_mode: 'fork',

      // 健康检查
      health_check_grace_period: 3000,
      health_check_fatal: true
    }
  ]
};
