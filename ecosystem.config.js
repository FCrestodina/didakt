// PM2 — proceso de Crestech Didáctico en el VPS.
//
// Los secretos NO van acá: van en `.env.local` del propio directorio, que Next
// lee también en producción. Este archivo se commitea; ese no.
module.exports = {
  apps: [
    {
      name: 'crestech-didactico',
      cwd: '/var/www/crestech-didactico',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      // fork y no cluster: Next ya maneja su concurrencia y el estado de las
      // salas vive en Postgres, pero un solo proceso hace los logs legibles y
      // alcanza de sobra para el uso que tiene esto (algunas aulas a la vez).
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '512M',
      autorestart: true,
      // Si se cae 10 veces seguidas, no tiene sentido seguir reintentando:
      // es un problema de config, no un cuelgue puntual.
      max_restarts: 10,
      min_uptime: '20s',
      merge_logs: true,
      time: true,
    },
  ],
};
