import type { ReactNode } from "react";
import { GRADOS_ORIENTACION, NOMBRE_ORIENTACION, type Celda, type Estado, type Tablero } from "@/lib/stem/grid/tipos";

/**
 * Tablero de grilla compartido por las dos herramientas.
 *
 * Casilleros grandes, trazo firme y una sola lectura posible. Ni los obstáculos
 * ni el destino se distinguen solo por color: el obstáculo lleva trama y el
 * destino lleva borde punteado más un marcador propio.
 */

/** Lado de un casillero en unidades del viewBox. */
const LADO = 100;

export function TableroSvg({
  tablero,
  estado,
  destino,
  pieza,
  piezaDestino,
  animado = true,
  descripcionAccesible,
  celdaResaltada,
  onCeldaClick,
  className,
}: {
  tablero: Tablero;
  /** Posición y orientación de la pieza. Si es null, no se dibuja la pieza. */
  estado: Estado | null;
  destino: Celda | null;
  pieza: ReactNode;
  /** Qué se dibuja sobre la celda-meta. Por defecto, un buzón esquemático. */
  piezaDestino?: ReactNode;
  animado?: boolean;
  /** Texto equivalente del tablero para tecnologías de asistencia. */
  descripcionAccesible: string;
  celdaResaltada?: Celda | null;
  onCeldaClick?: (celda: Celda) => void;
  className?: string;
}) {
  const ancho = tablero.columnas * LADO;
  const alto = tablero.filas * LADO;
  const celdas = Array.from({ length: tablero.filas }, (_, fila) =>
    Array.from({ length: tablero.columnas }, (_, columna) => ({ fila, columna })),
  ).flat();

  return (
    <svg
      viewBox={`-4 -4 ${ancho + 8} ${alto + 8}`}
      className={className}
      role="img"
      aria-label={descripcionAccesible}
    >
      <defs>
        {/* Trama del obstáculo: la diferencia no depende del color. */}
        <pattern id="trama-obstaculo" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={14} height={14} fill="#475569" />
          <line x1={0} y1={0} x2={0} y2={14} stroke="#1e293b" strokeWidth={7} />
        </pattern>
      </defs>

      {/* Casilleros */}
      {celdas.map((celda) => {
        const esResaltada =
          celdaResaltada?.fila === celda.fila && celdaResaltada?.columna === celda.columna;
        return (
          <rect
            key={`${celda.fila}-${celda.columna}`}
            x={celda.columna * LADO}
            y={celda.fila * LADO}
            width={LADO}
            height={LADO}
            fill={esResaltada ? "#dbeafe" : "#ffffff"}
            stroke="#94a3b8"
            strokeWidth={2}
            className={onCeldaClick ? "cursor-pointer" : undefined}
            onClick={onCeldaClick ? () => onCeldaClick(celda) : undefined}
          />
        );
      })}

      {/* Obstáculos */}
      {tablero.obstaculos.map((o) => (
        <rect
          key={`obs-${o.fila}-${o.columna}`}
          x={o.columna * LADO + 6}
          y={o.fila * LADO + 6}
          width={LADO - 12}
          height={LADO - 12}
          rx={8}
          fill="url(#trama-obstaculo)"
          stroke="#1e293b"
          strokeWidth={3}
        />
      ))}

      {/* Destino */}
      {destino && (
        <g>
          <rect
            x={destino.columna * LADO + 8}
            y={destino.fila * LADO + 8}
            width={LADO - 16}
            height={LADO - 16}
            rx={8}
            fill="#eff6ff"
            stroke="#2563eb"
            strokeWidth={4}
            strokeDasharray="10 8"
          />
          {/* Marcador de entrega. Por defecto un buzón esquemático, sin rasgos
              ni expresión; el Creador de misiones pasa el objeto que se eligió. */}
          <g transform={`translate(${destino.columna * LADO + LADO / 2} ${destino.fila * LADO + LADO / 2})`}>
            {piezaDestino ?? (
              <>
                <rect x={-18} y={-14} width={36} height={26} rx={4} fill="#2563eb" />
                <rect x={-11} y={-6} width={22} height={12} rx={2} fill="#ffffff" />
                <rect x={-2} y={12} width={4} height={14} fill="#2563eb" />
              </>
            )}
          </g>
        </g>
      )}

      {/* Pieza que se mueve */}
      {estado && (
        <g
          transform={`translate(${estado.celda.columna * LADO + LADO / 2} ${
            estado.celda.fila * LADO + LADO / 2
          }) rotate(${GRADOS_ORIENTACION[estado.orientacion]})`}
          style={animado ? { transition: "transform 320ms ease-in-out" } : undefined}
        >
          {pieza}
        </g>
      )}
    </svg>
  );
}

/**
 * Arma la descripción en texto del tablero, para quienes usan lector de
 * pantalla. El manual pide que los mensajes de estado estén disponibles como
 * texto y que nada dependa solo de la imagen.
 */
export function describirTablero(
  tablero: Tablero,
  estado: Estado | null,
  destino: Celda | null,
  nombreDestino?: string,
): string {
  const partes = [`Tablero de ${tablero.filas} filas por ${tablero.columnas} columnas.`];

  if (estado) {
    partes.push(
      `El dispositivo está en la fila ${estado.celda.fila + 1}, columna ${
        estado.celda.columna + 1
      }, orientado ${NOMBRE_ORIENTACION[estado.orientacion]}.`,
    );
  }
  if (destino) {
    partes.push(
      `El destino${nombreDestino ? ` (${nombreDestino})` : ""} está en la fila ${
        destino.fila + 1
      }, columna ${destino.columna + 1}.`,
    );
  }
  if (tablero.obstaculos.length === 0) {
    partes.push("No hay obstáculos.");
  } else {
    const lista = tablero.obstaculos
      .map((o) => `fila ${o.fila + 1}, columna ${o.columna + 1}`)
      .join("; ");
    partes.push(
      `Hay ${tablero.obstaculos.length} ${
        tablero.obstaculos.length === 1 ? "obstáculo" : "obstáculos"
      }: ${lista}.`,
    );
  }
  return partes.join(" ");
}
