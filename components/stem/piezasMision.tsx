/**
 * Personajes y objetos-meta del Creador de misiones.
 *
 * La personalización es puramente visual: no altera las reglas de movimiento
 * (sección 4.3 del manual). Ningún personaje tiene rostro ni puede expresar
 * estados; lo único que tiene que quedar claro es hacia dónde está orientado.
 *
 * Los personajes se dibujan apuntando hacia arriba en coordenadas locales y el
 * tablero los rota. Los objetos-meta no rotan.
 */

const TRAZO = "#334155";

/** Cuña frontal común a todos los personajes: marca la orientación sin ambigüedad. */
function Frente() {
  return <polygon points="0,-40 12,-25 -12,-25" fill="#1e293b" />;
}

function Carrito() {
  return (
    <g>
      <rect x={-28} y={-14} width={8} height={28} rx={3} fill={TRAZO} />
      <rect x={20} y={-14} width={8} height={28} rx={3} fill={TRAZO} />
      <rect x={-22} y={-24} width={44} height={46} rx={8} fill="#bfdbfe" stroke={TRAZO} strokeWidth={3} />
      <rect x={-13} y={-10} width={26} height={18} rx={3} fill="#ffffff" stroke={TRAZO} strokeWidth={2} />
      <Frente />
    </g>
  );
}

function Dron() {
  return (
    <g>
      <line x1={-20} y1={-18} x2={20} y2={18} stroke={TRAZO} strokeWidth={4} />
      <line x1={20} y1={-18} x2={-20} y2={18} stroke={TRAZO} strokeWidth={4} />
      {[
        [-22, -20],
        [22, -20],
        [-22, 20],
        [22, 20],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={9} fill="#e0e7ff" stroke={TRAZO} strokeWidth={3} />
      ))}
      <rect x={-14} y={-12} width={28} height={24} rx={6} fill="#c7d2fe" stroke={TRAZO} strokeWidth={3} />
      <Frente />
    </g>
  );
}

function Cohete() {
  return (
    <g>
      <polygon points="-20,18 -30,30 -14,28" fill="#fca5a5" stroke={TRAZO} strokeWidth={2.5} />
      <polygon points="20,18 30,30 14,28" fill="#fca5a5" stroke={TRAZO} strokeWidth={2.5} />
      <path
        d="M 0 -34 C 14 -16 16 8 12 26 L -12 26 C -16 8 -14 -16 0 -34 Z"
        fill="#fee2e2"
        stroke={TRAZO}
        strokeWidth={3}
      />
      <circle cx={0} cy={-6} r={7} fill="#ffffff" stroke={TRAZO} strokeWidth={2.5} />
      <Frente />
    </g>
  );
}

function Tractor() {
  return (
    <g>
      <circle cx={-18} cy={16} r={12} fill={TRAZO} />
      <circle cx={18} cy={16} r={12} fill={TRAZO} />
      <circle cx={-18} cy={-14} r={8} fill={TRAZO} />
      <circle cx={18} cy={-14} r={8} fill={TRAZO} />
      <rect x={-16} y={-18} width={32} height={34} rx={6} fill="#fde68a" stroke={TRAZO} strokeWidth={3} />
      <rect x={-10} y={-10} width={20} height={14} rx={2} fill="#ffffff" stroke={TRAZO} strokeWidth={2} />
      <Frente />
    </g>
  );
}

function Submarino() {
  return (
    <g>
      <line x1={0} y1={22} x2={0} y2={32} stroke={TRAZO} strokeWidth={4} />
      <line x1={-10} y1={30} x2={10} y2={30} stroke={TRAZO} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={20} ry={26} fill="#a5f3fc" stroke={TRAZO} strokeWidth={3} />
      <rect x={-8} y={-26} width={16} height={12} rx={3} fill="#67e8f9" stroke={TRAZO} strokeWidth={2.5} />
      <circle cx={0} cy={2} r={7} fill="#ffffff" stroke={TRAZO} strokeWidth={2.5} />
      <Frente />
    </g>
  );
}

const PERSONAJES_SVG: Record<string, () => React.ReactElement> = {
  carrito: Carrito,
  dron: Dron,
  cohete: Cohete,
  tractor: Tractor,
  submarino: Submarino,
};

/** Dibuja el personaje elegido. Ante un id desconocido cae en el carrito. */
export function PiezaPersonaje({ id }: { id: string }) {
  const Componente = PERSONAJES_SVG[id] ?? Carrito;
  return <Componente />;
}

/* ------------------------------------------------------------------------- */
/* Objetos-meta                                                              */
/* ------------------------------------------------------------------------- */

function Bandera() {
  return (
    <g>
      <rect x={-3} y={-30} width={6} height={58} rx={2} fill={TRAZO} />
      <polygon points="3,-28 34,-14 3,0" fill="#16a34a" stroke={TRAZO} strokeWidth={2.5} />
    </g>
  );
}

function Casa() {
  return (
    <g>
      <polygon points="0,-30 30,-4 -30,-4" fill="#f59e0b" stroke={TRAZO} strokeWidth={3} />
      <rect x={-22} y={-4} width={44} height={32} rx={3} fill="#fef3c7" stroke={TRAZO} strokeWidth={3} />
      <rect x={-7} y={8} width={14} height={20} rx={2} fill="#ffffff" stroke={TRAZO} strokeWidth={2.5} />
    </g>
  );
}

function Arbol() {
  return (
    <g>
      <rect x={-5} y={2} width={10} height={26} rx={2} fill="#92400e" />
      <circle cx={0} cy={-10} r={24} fill="#86efac" stroke={TRAZO} strokeWidth={3} />
    </g>
  );
}

function Pelota() {
  return (
    <g>
      <circle cx={0} cy={0} r={25} fill="#ffffff" stroke={TRAZO} strokeWidth={3} />
      <path d="M -25 0 h 50 M 0 -25 v 50" stroke={TRAZO} strokeWidth={2.5} fill="none" />
      <circle cx={0} cy={0} r={9} fill="#38bdf8" stroke={TRAZO} strokeWidth={2.5} />
    </g>
  );
}

function Buzon() {
  return (
    <g>
      <rect x={-3} y={10} width={6} height={20} fill={TRAZO} />
      <rect x={-24} y={-24} width={48} height={36} rx={5} fill="#2563eb" stroke={TRAZO} strokeWidth={3} />
      <rect x={-14} y={-14} width={28} height={16} rx={2} fill="#ffffff" />
    </g>
  );
}

const OBJETOS_SVG: Record<string, () => React.ReactElement> = {
  bandera: Bandera,
  casa: Casa,
  arbol: Arbol,
  pelota: Pelota,
  buzon: Buzon,
};

/** Dibuja el objeto-meta elegido. Ante un id desconocido cae en la bandera. */
export function PiezaObjetoMeta({ id }: { id: string }) {
  const Componente = OBJETOS_SVG[id] ?? Bandera;
  return <Componente />;
}

/** Miniatura suelta de una pieza, para las listas de elección del editor. */
export function MiniaturaPieza({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg viewBox="-40 -40 80 80" className={className} aria-hidden>
      {children}
    </svg>
  );
}
