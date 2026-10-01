# Crestech Didáctico

Catálogo público de secuencias didácticas de Crestech más el editor de bloques que arma algunas
de ellas. Next.js 16 (App Router) con Postgres vía Drizzle.

- Arrancar: copiá `.env.example` a `.env.local`, completá `DATABASE_URL`, exportala en la shell,
  corré `npm run db:push` y después `npm run dev`.
- Tests: `npm test`. Tipos: `npx tsc --noEmit`.
- Arquitectura, zonas del repo y convenciones: [`CLAUDE.md`](CLAUDE.md).
- Deploy (VPS propio, manual): [`docs/deploy-vps.md`](docs/deploy-vps.md).
