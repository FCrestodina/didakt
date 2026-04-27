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

Full-stack Next.js 16 (App Router). No separate backend — two API routes handle all persistence:

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
