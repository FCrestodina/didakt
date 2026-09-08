# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Next.js 16 has breaking changes** — before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Route params are `Promise<{ id: string }>` and must be unwrapped with `use()` in client components or `await`ed in server components.

## Commands

```bash
npm run dev      # dev server (port 3000, or next available)
npm run build    # production build + type check
npm run lint     # ESLint
npx tsc --noEmit # type check only
```

**MongoDB must be running first.** Portable instance at `C:\Users\FCRESTODINA\tools\mongodb\bin\mongod.exe`:

```powershell
# Start (run once, stays running in background)
Start-Process "C:\Users\FCRESTODINA\tools\mongodb\bin\mongod.exe" `
  -ArgumentList "--dbpath C:\Users\FCRESTODINA\tools\mongodb-data --port 27017" `
  -WindowStyle Hidden
```

Or use the helper script: `C:\Users\FCRESTODINA\tools\start-mongo.ps1`

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
| Panel + editor | `/admin`, `/courses/[id]/edit`, `/courses/[id]/preview` | Claro | MongoDB |

**El catálogo no puede depender de la base.** Las secuencias alojadas se declaran en
`content/secuencias.ts` (en código, no en base) justamente para eso; las secuencias del editor se
suman encima desde el cliente y **fallan en silencio** si Mongo no responde
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
- **Un solo Postgres, esquemas separados**: `lib/billetera/schema.ts` y `lib/stem/schema.ts`, los dos
  en `drizzle.config.ts`. Las tablas no se pisan (`classrooms`/`students`/`movements`/`promo_usages`
  contra `salas`/`misiones`), así que no hace falta prefijarlas. `npm run db:push` aplica las dos.
- **Los tests de las secuencias son la red de seguridad del repo** (254: 56 de billetera + 198 de
  STEM). didakt no tiene tests propios, así que si tocás algo de `lib/stem/` o `lib/billetera/`,
  `npm test` es lo único que te avisa.

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

### MongoDB schema

`lib/models/Course.ts` uses `strict: false` on the blocks subdocument — blocks are stored as raw JSON. TypeScript types are the source of truth for block shape, not Mongoose.

### Conventions

- `@/*` maps to project root (no `src/` directory)
- All editor and preview components are `'use client'`
- `cn()` from `lib/utils.ts` for conditional Tailwind classes
- IDs generated with `Math.random().toString(36).slice(2, 10)`
- **Never send JSON via bash `curl` with Spanish characters** — encoding breaks. Use PowerShell `Invoke-RestMethod` with explicit UTF-8 bytes instead.
