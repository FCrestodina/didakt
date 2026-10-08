# DESIGN.md — didakt

Todavía no hay un sistema de diseño escrito para este repo: por ahora solo las reglas de uso y la deuda medida. **Tokens:** los tokens de `app/globals.css:7` (`@theme`: `noche`, `oro`, `oro-claro`, `oro-oscuro`, `tenue`, `apagado`). Hoy solo los usa el catálogo público (`app/(sitio)`, `components/sitio`, `components/marca`).

## Reglas de UI (nota `buenas-practicas-ui` del vault)

> Agregado el 2026-10-08. Es criterio de uso, vale para cualquier look: el look sale de los tokens de arriba (y del DESIGN.md que se escriba). Lo que el repo rompe hoy está abajo, en "Deuda medida": no se suma deuda nueva de ese tipo y, al tocar una de esas pantallas, se corrige ahí mismo.

- **Un solo botón Primary por vista**; el resto Secondary (contorno), Ghost o Link. Repetir el *mismo* CTA en el hero y en el cierre de una landing larga no cuenta: es una sola acción.
- **Nunca `outline: none` sin foco visible de reemplazo** (anillo u outline en `:focus-visible`). Cambiar solo el color del borde no alcanza.
- **El estado nunca solo por color**: texto o ícono al lado.
- **Tablas sin sombra.**
- **Colores por token del tema**, nunca hex ni clases primitivas (`bg-red-500`) en un componente.
- Contraste AA (4.5:1 texto normal, 3:1 grande) y touch target de 44×44px en mobile.

### Deuda medida (2026-10-08)

- **Clases primitivas en vez de tokens (la deuda grande):** ~694 usos (`bg-indigo-600`, `text-gray-700`…) en 53 archivos: el editor, el panel y las pantallas de billetera y stem ignoran los tokens. Hex fuera de SVG: `components/marca/LogoCrestech.tsx:17-19` (repite el oro del token), `components/dashboard/CourseCard.tsx:33,38` (fallback `#6366f1`), `text-[#171717]` en `app/billetera-virtual/layout.tsx:17` y `app/stem/layout.tsx:16`. Los hex de los SVG de ilustración (`components/stem/*`) son tolerables; la paleta de `components/editor/CourseSettings.tsx:7` es dato elegible por el usuario, no tema.
- **Varios Primary por vista:** `app/admin/page.tsx:92,120` ("Nueva secuencia" y "Crear primera secuencia", misma acción, se ven juntos sin secuencias); `app/billetera-virtual/page.tsx:23,36`.
- **Estado solo por color (leve):** `components/preview/BlockRenderer.tsx:17-19`: las opciones del quiz quedan verdes/rojas solo por borde y fondo; el feedback de abajo (`:25-27`) sí lo dice en texto.
- Sin deuda en: foco (`:focus-visible` global en `app/globals.css:30`; no verificado en navegador sobre los `contentEditable`), sombra en tablas.
- `app/billetera-virtual/` y `app/stem/` vienen de `billetera-virtual-educativa` y `secuencia-stem-primer-ciclo`: lo que se arregle acá se replica allá.
