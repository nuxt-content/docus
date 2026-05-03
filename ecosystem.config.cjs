// =============================================================================
//  PM2 Ecosystem Config — assets-standalone
//  assets.alazab.com — منفذ 3005
// =============================================================================

module.exports = {
  apps: [
    {
      name: 'assets-standalone',
      script: 'server.js',
      cwd: '/var/www/assets',

      // بيئة الإنتاج
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },

      // إعدادات التشغيل
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
      max_memory_restart: '256M',

      // ملفات السجلات
      out_file: '/var/log/assets-standalone/out.log',
      error_file: '/var/log/assets-standalone/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
