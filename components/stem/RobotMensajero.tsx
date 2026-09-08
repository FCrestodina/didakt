/**
 * Dispositivo mensajero.
 *
 * Sección 3.1 del manual: vehículo autónomo de reparto, con compartimento
 * visible para el sobre, luz de estado y orientación frontal inequívoca.
 *
 * Prohibido y por eso ausente: rostro, ojos, boca, cejas, manos, brazos,
 * piernas, silueta humana, nombre propio y cualquier gesto emocional.
 *
 * Se dibuja apuntando hacia arriba en coordenadas locales; el tablero lo rota
 * según la orientación cardinal.
 */

export type LuzEstado = "inactiva" | "captura" | "procesando" | "movimiento" | "bloqueada";

const COLOR_LUZ: Record<LuzEstado, string> = {
  inactiva: "#94a3b8",
  captura: "#2563eb",
  procesando: "#2563eb",
  movimiento: "#16a34a",
  bloqueada: "#b45309",
};

export function RobotMensajero({
  luz = "inactiva",
  llevaSobre = true,
}: {
  luz?: LuzEstado;
  llevaSobre?: boolean;
}) {
  return (
    <g>
      {/* Ruedas: marca técnica de vehículo, sin miembros ni articulaciones. */}
      <rect x={-30} y={-16} width={9} height={32} rx={4} fill="#334155" />
      <rect x={21} y={-16} width={9} height={32} rx={4} fill="#334155" />

      {/* Chasis */}
      <rect x={-24} y={-26} width={48} height={52} rx={9} fill="#e2e8f0" stroke="#475569" strokeWidth={3} />

      {/* Compartimento de carga, con el sobre a la vista */}
      <rect x={-16} y={-8} width={32} height={22} rx={3} fill="#cbd5e1" stroke="#475569" strokeWidth={2} />
      {llevaSobre && (
        <g>
          <rect x={-12} y={-4} width={24} height={15} rx={2} fill="#ffffff" stroke="#475569" strokeWidth={2} />
          <polyline
            points="-12,-4 0,5 12,-4"
            fill="none"
            stroke="#475569"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Frente: la flecha marca hacia dónde está orientado el dispositivo.
          Es la única señal de dirección y no depende del color. */}
      <polygon points="0,-40 13,-24 -13,-24" fill="#1e293b" />

      {/* Luz de estado. Indicador técnico permitido por el manual: nunca es la
          única vía de información, el panel de estado siempre lo dice en texto. */}
      <circle cx={0} cy={20} r={6} fill={COLOR_LUZ[luz]} stroke="#1e293b" strokeWidth={2} />
    </g>
  );
}
