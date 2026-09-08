/**
 * Catálogo de secuencias didácticas alojadas en Crestech Didáctico.
 *
 * Vive en código y no en base de datos a propósito: cada secuencia es una app
 * propia que se sirve desde este mismo deploy, así que su ficha es parte del
 * repo igual que su código. Consecuencia buscada: la home no necesita base de
 * datos para renderizar — sólo las secuencias armadas con el editor de bloques
 * (que sí viven en base) se agregan encima, y si la base no responde el
 * catálogo se sigue viendo.
 *
 * Las secuencias del editor NO se listan acá: salen de `/api/courses`.
 */

export type NivelEducativo = 'inicial' | 'primario' | 'secundario';

/**
 * - `disponible`: ya se sirve desde este deploy, en la ruta interna del recurso.
 * - `en-migracion`: todavía la sirve su deploy viejo (`urlExterna`). La ruta
 *   interna ya está decidida y es la que va a quedar cuando se mude.
 */
export type EstadoSecuencia = 'disponible' | 'en-migracion';

export interface RecursoSecuencia {
  slug: string;
  nombre: string;
  descripcion: string;
  /** En qué momento de la secuencia se usa. */
  momento?: string;
  /** Ruta definitiva dentro de Crestech Didáctico. */
  ruta: string;
  /** Path equivalente en el deploy viejo, mientras la secuencia esté en migración. */
  rutaExterna?: string;
}

export interface MaterialDocente {
  nombre: string;
  descripcion: string;
  /** Path dentro de `public/`. */
  archivo: string;
}

export interface SecuenciaAlojada {
  slug: string;
  titulo: string;
  bajada: string;
  descripcion: string;
  nivel: NivelEducativo;
  ciclo?: string;
  grados: string;
  areas: string[];
  /** Programa educativo para el que se desarrolló, si aplica. */
  programa?: string;
  /** Color de acento de la ficha. */
  acento: string;
  estado: EstadoSecuencia;
  /** Deploy que sirve la secuencia mientras `estado` sea `en-migracion`. */
  urlExterna?: string;
  recursos: RecursoSecuencia[];
  materiales: MaterialDocente[];
  repo: string;
}

export const SECUENCIAS: SecuenciaAlojada[] = [
  {
    slug: 'stem-primer-ciclo',
    titulo: 'Secuencia STEM+ · Primer Ciclo',
    bajada: 'Del lenguaje cotidiano a la instrucción programable',
    descripcion:
      'Dos recursos de una misma secuencia. Primero los chicos descubren, hablándole a un robot, que no toda indicación se puede convertir en una acción. Después inventan su propio código de símbolos y lo usan para armar misiones que resuelve otro grupo. Sin cuentas, sin nombres y sin datos personales de los chicos.',
    nivel: 'primario',
    ciclo: 'Primer ciclo',
    grados: '1.º a 3.º grado',
    areas: ['Pensamiento computacional', 'STEM+'],
    programa: 'Buenos Aires Aprende',
    acento: '#38bdf8',
    estado: 'en-migracion',
    urlExterna: 'https://app-production-176a.up.railway.app',
    recursos: [
      {
        slug: 'robot',
        nombre: 'Robot mensajero',
        momento: 'Desafío 1 · diagnóstico',
        descripcion:
          'Simulador para probar indicaciones orales. Distingue la instrucción que se puede ejecutar de la que le falta información, de la que está fuera del repertorio del robot y del fallo de reconocimiento. Entrada por voz y escrita, tres misiones, sin base de datos.',
        ruta: '/stem/robot',
        rutaExterna: '/robot',
      },
      {
        slug: 'misiones',
        nombre: 'Creador de misiones',
        momento: 'Desafíos 2, 3 y 4',
        descripcion:
          'La clase redibuja los cuatro símbolos que acordó en papel; cada grupo arma una misión con escenario, personaje, salida y meta; y el grupo visitante la juega en una sala de solo lectura. Una misión sólo se publica con una solución comprobada. La persistencia es por sala de clase, no por estudiante.',
        ruta: '/stem/misiones',
        rutaExterna: '/misiones',
      },
    ],
    materiales: [
      {
        nombre: 'Manual del docente',
        descripcion: 'Cómo se usa cada recurso en cada momento de la secuencia. 13 páginas.',
        archivo: '/materiales/manual-docente-stem.pdf',
      },
    ],
    repo: 'secuencia-stem-primer-ciclo',
  },
  {
    slug: 'billetera-virtual',
    titulo: 'Billetera Virtual Educativa',
    bajada: 'Dinero digital, sin dinero real',
    descripcion:
      'Simulador de billetera virtual para trabajar consumo, ahorro y medios de pago digitales en el aula. El docente arma un aula con un crédito inicial y genera los QR de las operaciones; cada estudiante entra con un apodo, paga escaneando y ve su saldo y su historial. Es una simulación: no hay dinero real ni pasarelas de pago, y no se guardan datos personales.',
    nivel: 'primario',
    ciclo: 'Segundo ciclo',
    grados: '6.º y 7.º grado',
    areas: ['Educación financiera', 'Ciudadanía digital'],
    programa: 'Buenos Aires Aprende',
    acento: '#34d399',
    estado: 'en-migracion',
    urlExterna: 'https://billetera-virtual-educativa-production.up.railway.app',
    recursos: [
      {
        slug: 'docente',
        nombre: 'Panel docente',
        momento: 'Antes y durante la clase',
        descripcion:
          'Se entra con el PIN compartido. Crea el aula con su crédito inicial, muestra en vivo quién se conectó y con cuánto saldo, y permite ajustar créditos o cerrar el aula al terminar.',
        ruta: '/billetera-virtual/docente',
        rutaExterna: '/docente',
      },
      {
        slug: 'generar',
        nombre: 'Generador de QR',
        momento: 'Armado de la actividad',
        descripcion:
          'Genera los QR de cada operación —compras, descuentos y reintegros— para imprimir o proyectar. Sirve tanto para una demostración con proyector como para una feria de comercios con varios puestos.',
        ruta: '/billetera-virtual/generar',
        rutaExterna: '/generar',
      },
      {
        slug: 'estudiante',
        nombre: 'Billetera del estudiante',
        momento: 'Durante la clase',
        descripcion:
          'El estudiante entra al aula por código o escaneando el QR, elige apodo y avatar, y desde ahí paga escaneando los QR de los puestos. Ve el saldo y el historial de cada movimiento.',
        ruta: '/billetera-virtual/estudiante',
        rutaExterna: '/estudiante',
      },
    ],
    materiales: [
      {
        nombre: 'Manual del docente',
        descripcion: 'Puesta en marcha del aula y de la feria de comercios, paso a paso. 11 páginas.',
        archivo: '/materiales/manual-docente-billetera.pdf',
      },
    ],
    repo: 'billetera-virtual-educativa',
  },
  {
    slug: 'mundialito-escolar',
    titulo: 'Mundialito Escolar',
    bajada: 'Un torneo entero, sin planilla',
    descripcion:
      'Organizador de torneos escolares con el formato de un mundial: fase de grupos todos contra todos y después eliminación directa. Se cargan los equipos, la app arma los grupos y el fixture, y las tablas y el cuadro final se actualizan solos a medida que se cargan los resultados. Funciona sin conexión y sin cuentas: el torneo vive en el navegador y se comparte con un código.',
    nivel: 'primario',
    grados: 'Todos los grados',
    areas: ['Educación física', 'Convivencia'],
    acento: '#fbbf24',
    estado: 'disponible',
    recursos: [
      {
        slug: 'torneo',
        nombre: 'Organizador de torneo',
        descripcion:
          'Carga de equipos, sorteo de grupos, fixture, tabla de posiciones y cuadro de eliminatorias en una sola pantalla. El estado se guarda en el navegador y se puede exportar como código para retomarlo en otro dispositivo.',
        ruta: '/mundialito',
      },
    ],
    materiales: [],
    repo: 'mundialito-escolar',
  },
];

export function buscarSecuencia(slug: string): SecuenciaAlojada | undefined {
  return SECUENCIAS.find((s) => s.slug === slug);
}

/**
 * A dónde manda el botón de un recurso: a su ruta interna si la secuencia ya
 * está alojada acá, o al deploy viejo mientras siga en migración.
 */
export function enlaceDeRecurso(
  secuencia: SecuenciaAlojada,
  recurso: RecursoSecuencia
): { href: string; externo: boolean } {
  if (secuencia.estado === 'disponible' || !secuencia.urlExterna) {
    return { href: recurso.ruta, externo: false };
  }
  return {
    href: `${secuencia.urlExterna}${recurso.rutaExterna ?? ''}`,
    externo: true,
  };
}

export const NIVELES: Record<NivelEducativo, string> = {
  inicial: 'Nivel inicial',
  primario: 'Nivel primario',
  secundario: 'Nivel secundario',
};
