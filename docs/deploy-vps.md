# Deploy de Crestech Didáctico en un VPS

Runbook para dejar el hub andando en un VPS de Hostinger. Está escrito para
seguirlo de arriba a abajo la primera vez; al final hay el flujo corto de cada
deploy posterior.

> **Tiene que ser un plan VPS/KVM.** El hosting compartido de Hostinger es PHP +
> MySQL: no corre un proceso Node persistente, no deja abrir puertos propios y
> no soporta WebSockets, así que un Next con SSR y base de datos no arranca ahí.
> Si el plan dice "Web Hosting" o "Cloud Hosting", no sirve para esto.

## 0. Antes de empezar

- Un VPS con **Ubuntu 24.04 LTS**.
- Un subdominio apuntando a la IP del VPS con un registro `A` — en este runbook,
  `didactico.crestech.com.ar`. Conviene crearlo primero: la propagación tarda y
  Certbot lo necesita resuelto.
- Acceso SSH con clave. **No uses la cuenta `root` para correr la app.**

## 1. Usuario y base del sistema

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Firewall — sólo SSH y web. Postgres no se expone: la app le habla por localhost.

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

De acá en adelante, todo como `deploy`.

## 2. Node, PM2, Nginx, Postgres

```bash
sudo apt update && sudo apt install -y nginx postgresql certbot python3-certbot-nginx git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 24 && nvm alias default 24
npm install -g pm2
```

Node 24 es lo que dice `.node-version` del repo y sobre lo que se probaron el
build y los 275 tests.

## 3. Base de datos

Una sola base para todo el hub: las tres secuencias y el editor conviven ahí sin
pisarse.

```bash
sudo -u postgres psql -c "CREATE USER didactico WITH PASSWORD 'PONE_UNA_CLAVE_LARGA';"
sudo -u postgres psql -c "CREATE DATABASE crestech_didactico OWNER didactico;"
```

Postgres viene escuchando sólo en localhost por defecto en Ubuntu; **dejalo
así**.

## 4. Código y configuración

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www
git clone https://github.com/FCrestodina/didakt.git /var/www/crestech-didactico
cd /var/www/crestech-didactico
npm ci
cp .env.example .env.local
```

Editá `.env.local` con la clave real de Postgres y el PIN docente:

```
DATABASE_URL=postgres://didactico:LA_CLAVE@localhost:5432/crestech_didactico
TEACHER_PIN=el-pin-que-uses-en-clase
NEXT_PUBLIC_SITE_URL=https://didactico.crestech.com.ar
```

```bash
chmod 600 .env.local
```

Aplicá los tres esquemas. **`db:push` no lee `.env.local`** — eso lo hace Next,
no drizzle-kit — así que hay que exportar la variable a mano:

```bash
export DATABASE_URL="postgres://didactico:LA_CLAVE@localhost:5432/crestech_didactico"
npm run db:push
```

Comprobá que quedaron las 7 tablas:

```bash
psql "$DATABASE_URL" -c "\dt"
# classrooms, courses, misiones, movements, promo_usages, salas, students
```

## 5. Build y arranque

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # imprime un comando con sudo: copialo y corrélo
```

Verificá que el proceso responde antes de tocar Nginx:

```bash
curl -s localhost:3000/api/health
# {"ok":true,"base":"ok"}
```

Si dice `"base":"error"`, el problema es la conexión a Postgres, no la app.
Si dice `"base":"sin-configurar"`, PM2 no está viendo el `.env.local`.

## 6. Nginx y certificado

```bash
sudo cp docs/nginx-crestech-didactico.conf /etc/nginx/sites-available/crestech-didactico
sudo ln -s /etc/nginx/sites-available/crestech-didactico /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d didactico.crestech.com.ar
```

Certbot reescribe el archivo agregando el bloque 443 y el redirect. La
renovación automática ya queda instalada; se comprueba con
`sudo certbot renew --dry-run`.

**El HTTPS no es opcional acá:** el micrófono del Robot mensajero y la cámara de
la Billetera sólo los habilita el navegador sobre HTTPS o localhost. Sobre HTTP
las dos secuencias quedan a medias.

## 7. Verificación

```bash
curl -s https://didactico.crestech.com.ar/api/health
for r in / /secuencias/stem-primer-ciclo /stem/robot /billetera-virtual /mundialito /admin; do
  printf "%-34s " "$r"
  curl -s -o /dev/null -w "%{http_code}\n" "https://didactico.crestech.com.ar$r"
done
```

Y el script de aceptación de las salas de STEM, que prueba la base de verdad
(crea una sala, publica una misión, comprueba que el código de juego no puede
editar ni borrar, y limpia lo que creó):

```bash
node scripts/verificar-api.mjs https://didactico.crestech.com.ar   # desde el repo secuencia-stem-primer-ciclo
```

A mano, con un celular real —es lo único que no se puede automatizar—:

- `/stem/robot` → "Activar micrófono" pide permiso y reconoce una instrucción.
- `/billetera-virtual/docente` → entrar con el PIN, crear un aula, y que el QR
  de "unirse al aula" apunte a `https://didactico.crestech.com.ar/billetera-virtual/estudiante?aula=...`.
- Escanear ese QR con otro dispositivo y pagar un QR de producto.

## 8. Recién ahora, bajar los deploys viejos

Con el hub verificado andando, dar de baja en Railway:
`app-production-176a` (STEM), `billetera-virtual-educativa-production` y el de
Mundialito.

> **Antes de borrar el servicio de la Billetera**, el Postgres de Railway tiene
> el aula `7B Demo` con los movimientos reales que salen en las capturas del
> manual del docente. Si esos datos importan, `pg_dump` primero.

## Deploys posteriores

```bash
cd /var/www/crestech-didactico
git pull
npm ci
npm run build
pm2 reload crestech-didactico
curl -s localhost:3000/api/health
```

Si el cambio toca un esquema, entre `npm ci` y `npm run build`:

```bash
export DATABASE_URL="postgres://didactico:LA_CLAVE@localhost:5432/crestech_didactico"
npm run db:push
```

## Operación

| Para | Comando |
|---|---|
| Ver logs | `pm2 logs crestech-didactico` |
| Estado y memoria | `pm2 status` |
| Reiniciar | `pm2 reload crestech-didactico` |
| Logs de Nginx | `sudo tail -f /var/log/nginx/error.log` |
| Backup de la base | `pg_dump "$DATABASE_URL" > backup-$(date +%F).sql` |

Conviene dejar el `pg_dump` en un cron diario: las salas de STEM caducan solas a
los 30 días, pero las aulas de la Billetera y las secuencias del editor no
tienen otra copia.
