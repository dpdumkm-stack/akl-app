module.exports = {
  apps: [
    {
      name: "akl-app",
      script: "npm",
      args: "start",
      instances: 1, // Anda bisa ganti ke "max" jika server memiliki banyak CPU
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      
      // Pengaturan Log Terpisah
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
