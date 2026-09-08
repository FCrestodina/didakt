# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Next.js 16 has breaking changes** — before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Route params are `Promise<{ id: string }>` and must be unwrapped with `use()` in client components or `await`ed in server components.

## Commands

```bash
npm run dev      # dev server (port 3000, or next available)
npm run build    # production build + type check
npm run lint     # ESLint
npm test         # vitest — 275 tests
npx tsc --noEmit # type check only
npm run db:push  # aplica los tres esquemas Drizzle a DATABASE_URL
```

**Una sola base: Postgres.** Copiá `.env.example` a `.env.local`, completá `DATABASE_URL` y corré
`npm run db:push`. Sin base andan igual el catálogo público, `/stem/robot` y `/mundialito`; el resto
no.

Ojo: `db:push` **no lee `.env.local`** (eso lo hace Next, no drizzle-kit) — exportá `DATABASE_URL`
en la shell antes de correrlo.

## Architecture

Full-stack Next.js 16 (App Router). The repo is **Crestech Didáctico**: a public catalogue of
didactic sequences plus the block editor that authors some of them. Two things live here that used
to be separate concerns, so keep them separate when editing:

| Zona | Rutas | Tema | Base de datos |
|---|---|---|---|
| Catálogo público | `app/(sitio)/` — `/`, `/secuencias/[slug]` | Marca Crestech, oscuro | **Ninguna** |
| Secuencia STEM+ | `/stem/robot`, `/stem/misiones/*` + `app/api/salas/*` | Claro, propio | Postgres (`/robot` no la toca) |
| Billetera Virtual | `/billetera-virtual/*` + `app/api/{classrooms,students,payments,movements}` | Claro, propio | Postgres |
| Mundialito | `/mundialito` (estático en `public/`) | Claro, propio | Ninguna (`localStorage`) |
| Panel + editor | `/admin`, `/courses/[id]/edit`, `/courses/[id]/preview` | Claro | Postgres |

**El catálogo no puede depender de la base.** Las secuencias alojadas se declaran en
`content/secuencias.ts` (en código, no en base) justamente para eso; las secuencias del editor se
suman encima desde el cliente y **fallan en silencio** si la base no responde
(`components/sitio/SecuenciasDelEditor.tsx`). Si agregás algo a la home, mantené esa propiedad: sin
base de datos, `/` tiene que seguir renderizando.

### Cómo conviven las secuencias alojadas

Cada secuencia vino de su propio repo (`secuencia-stem-primer-ciclo`, `billetera-virtual-educativa`,
`mundialito-escolar`) y se movió acá sin reescribirse. Las reglas que hacen que no se pisen:

- **Páginas namespaceadas, API no.** Las páginas viven bajo el prefijo de su secuencia; las rutas de
  API se dejaron **donde estaban** porque no colisionan (`/api/salas/*` contra
  `/api/classrooms|students|payments|movements` contra `/api/courses`). Eso evitó reescribir cada
  `fetch` y cada mock de los tests. Si agregás una secuencia con una ruta de API que sí colisione,
  namespaceala; no renombres las existentes.
- **Cada secuencia trae su tema en su `layout.tsx`**, no en `globals.css`: fuente propia, fondo
  claro y `color-scheme: light` (las apps son de uso escolar y el modo oscuro del celular las deja
  ilegibles). Las capturas de sus manuales del docente son de esas pantallas — **no les cambies la
  tipografía sin regenerar los manuales**.
- **Un solo Postgres, tres esquemas separados**: `lib/billetera/schema.ts`, `lib/stem/schema.ts` y
  `lib/editor/schema.ts`, los tres en `drizzle.config.ts`. Las tablas no se pisan
  (`classrooms`/`students`/`movements`/`promo_usages` contra `salas`/`misiones` contra `courses`),
  así que no hace falta prefijarlas. `npm run db:push` aplica los tres.
- **Cada zona abre su propio pool** (`lib/billetera/db.ts`, `lib/stem/db.ts`, `lib/editor/db.ts`)
  contra la misma base. Funciona, pero son tres pools donde alcanzaría uno: consolidarlos al tunear
  el VPS.
- **Los tests son la red de seguridad del repo** (275: 56 de billetera, 198 de STEM, 21 del editor).
  Si tocás `lib/`, `npm test` es lo único que te avisa.

Persistencia del editor — dos API routes, sin backend separado:

- `app/api/courses/route.ts` — GET list, POST create
- `app/api/courses/[id]/route.ts` — GET, PUT, DELETE single course

### Editor data flow

```
Page load  → GET /api/courses/[id] → setCourse() → Zustand store
User edits → pure in-memory mutations → dirty = true
Autosave   → debounced 3s after last change → PUT /api/courses/[id]
Ctrl+S     → immediate save
```

The save function reads state via `useEditorStore.getState()` (not from closure) to avoid stale captures across the debounce delay.

### Zustand store (`store/editorStore.ts`)

Single store owns the full `Course` object in memory. Key state: `course`, `activeLessonId`, `selectedBlockId`, `dirty`, `saving`, `settingsOpen`.

Key actions:
- `setCourse(course)` — replaces entire course, resets `activeLessonId` to first lesson
- `addBlock(type)` / `updateBlock(id, data)` / `deleteBlock(id)` / `duplicateBlock(id)` — operate on active lesson
- `reorderBlocks(from, to)` / `reorderLessons(from, to)` — index-based swaps (for dnd-kit)
- `setSettingsOpen(bool)` — controls the CourseSettings modal

### Block system

14 block types, all defined as a discriminated union in `types/index.ts`. **Adding a new block type requires changes in 5 places:**

1. `types/index.ts` — add to `BlockType` union, define interface, add to `Block` union
2. `store/editorStore.ts` — add `defaultBlock` case
3. `components/editor/blocks/MyBlock.tsx` — editor component (new file)
4. `components/editor/BlockItem.tsx` — add case to `BlockContent` switch
5. `components/preview/BlockRenderer.tsx` — add case to `BlockRenderer` switch
6. `components/editor/BlockToolbar.tsx` — add entry to `blocks` array

Current block types: `heading`, `text`, `image`, `video`, `quiz`, `accordion`, `divider`, `bullet-list`, `numbered-list`, `quote`, `callout`, `code`, `flashcard`, `timeline`.

### Preview (`app/courses/[id]/preview/page.tsx`)

Stateful client component tracking lesson completion (`Set<number>`). When all lessons are marked done it renders a completion screen instead of the lesson content. The "Siguiente" button both marks current lesson complete and advances — last lesson shows "Finalizar curso".

### Persistencia del editor (`lib/editor/`)

`schema.ts` guarda `lessons` como **`jsonb`** — el equivalente exacto del `strict: false` que tenía
el subdocumento de bloques en Mongo. La fuente de verdad de la forma de un bloque siguen siendo los
tipos de `types/index.ts`, no el esquema de la base.

`cursos.ts` es la capa de datos, y **`camposEditables()` es lo que hay que respetar**: el editor
manda el curso entero en cada PUT, `id` y timestamps incluidos. Mongoose los descartaba por esquema;
Drizzle no filtra nada, así que sin esa función un PUT podría reescribir la clave primaria o falsear
el `createdAt`. **Si agregás un campo a `Course`, agregalo también ahí o se descarta en silencio.**

`esIdValido()` corta los ids que no son UUID antes de que lleguen a la query: si no, Postgres tira
error de tipo y el handler devuelve 500 en vez de 404. Los ids viejos de Mongo (24 hex) caen por ahí.

### Deploy

VPS propio (Ubuntu + Node 24 + PM2 + Nginx + Certbot + Postgres local), **no**
Railway como el resto de los repos personales. Runbook completo en
[`docs/deploy-vps.md`](docs/deploy-vps.md); config en `ecosystem.config.js` y
`docs/nginx-crestech-didactico.conf`. `git push` **no** deploya: el deploy es manual.

`/api/health` distingue tres estados a propósito — `sin-configurar` no es lo mismo que
`error`, porque el catálogo, `/stem/robot` y `/mundialito` andan sin base. Sólo devuelve 503
cuando `DATABASE_URL` está definida y la base no responde.

**HTTPS no es opcional**: el micrófono del Robot mensajero y la cámara de la Billetera sólo
los habilita el navegador sobre HTTPS o localhost.

`images.remotePatterns` **se sacó a propósito** y no hay que reponerlo sin pensarlo: ningún
componente usa `next/image` (las tres imágenes van con `<img>` crudo), así que con `'**'`
el endpoint `/_next/image` era un proxy abierto — se lo verificó sirviendo un PNG de un host
externo. Si algún día se usa `next/image` con imágenes de afuera, listar **sólo** esos hosts.

### Conventions

- `@/*` maps to project root (no `src/` directory)
- All editor and preview components are `'use client'`
- `cn()` from `lib/utils.ts` for conditional Tailwind classes
- IDs generated with `Math.random().toString(36).slice(2, 10)`
- **Never send JSON via bash `curl` with Spanish characters** — encoding breaks. Use PowerShell `Invoke-RestMethod` with explicit UTF-8 bytes instead.
