import { celdaAdelante, celdaTransitable, girar, mismaCelda } from "./motor";
import {
  ORIENTACIONES,
  type Accion,
  type Celda,
  type Estado,
  type Orientacion,
  type Tablero,
} from "./tipos";

/**
 * Análisis de una misión: sirve para impedir configuraciones imposibles y
 * misiones triviales en el editor del Creador de misiones (sección 4.2 del
 * manual), y para verificar en los tests que los tableros cumplen lo pedido.
 *
 * Nada de esto se le muestra al estudiante que juega: la sala de misiones nunca
 * revela una solución antes del intento.
 */

export interface AnalisisMision {
  /** Existe al menos una secuencia que llega a la meta. */
  alcanzable: boolean;
  /** Cantidad mínima de acciones necesarias, o null si no es alcanzable. */
  longitudMinima: number | null;
  /** Una secuencia mínima cualquiera. Solo para validación interna. */
  solucionMinima: Accion[] | null;
  /** La meta se alcanza avanzando en línea recta, sin ningún giro. */
  hayRectaSinGiros: boolean;
  /**
   * Cantidad de secuencias mínimas distintas. Si es mayor que 1, la misión
   * admite más de un recorrido válido de la misma longitud.
   */
  solucionesMinimas: number;
  /**
   * La misión se resuelve con una sola acción o sin ningún giro. El editor pide
   * elegir otra ubicación cuando esto es verdadero.
   */
  trivial: boolean;
}

/** Acciones que pueden cambiar el estado. DETENER nunca acerca a la meta. */
const ACCIONES_UTILES: readonly Accion[] = [
  "AVANZAR",
  "GIRO_DERECHA_90",
  "GIRO_IZQUIERDA_90",
] as const;

function clave(celda: Celda, orientacion: Orientacion): string {
  return `${celda.fila},${celda.columna},${orientacion}`;
}

/**
 * ¿Se llega a la meta avanzando derecho desde la salida, sin girar nunca?
 *
 * Recorre casillero por casillero, igual que el motor: un obstáculo o el borde
 * del tablero cortan el recorrido.
 */
export function llegaEnLineaRecta(
  tablero: Tablero,
  inicio: Estado,
  meta: Celda,
): boolean {
  let estado = inicio;
  // Como mucho hay filas × columnas pasos útiles antes de salir o chocar.
  const tope = tablero.filas * tablero.columnas;
  for (let i = 0; i < tope; i++) {
    const destino = celdaAdelante(estado);
    if (!celdaTransitable(tablero, destino)) return false;
    estado = { ...estado, celda: destino };
    if (mismaCelda(estado.celda, meta)) return true;
  }
  return false;
}

/**
 * Recorre el espacio de estados (celda × orientación) a lo ancho para encontrar
 * la solución más corta, contar cuántas soluciones mínimas distintas hay y
 * decidir si la misión es alcanzable.
 *
 * La celda-meta es terminal: entrar en ella finaliza la ejecución, así que no se
 * expande hacia adelante desde ahí.
 */
export function analizarMision(
  tablero: Tablero,
  inicio: Estado,
  meta: Celda,
): AnalisisMision {
  // Caso límite: la salida y la meta son la misma celda. El editor lo rechaza
  // antes, pero el análisis no debe romperse si igual llega hasta acá.
  if (mismaCelda(inicio.celda, meta)) {
    return {
      alcanzable: true,
      longitudMinima: 0,
      solucionMinima: [],
      hayRectaSinGiros: true,
      solucionesMinimas: 1,
      trivial: true,
    };
  }

  const inicioValido =
    celdaTransitable(tablero, inicio.celda) && celdaTransitable(tablero, meta);
  if (!inicioValido) {
    return {
      alcanzable: false,
      longitudMinima: null,
      solucionMinima: null,
      hayRectaSinGiros: false,
      solucionesMinimas: 0,
      trivial: false,
    };
  }

  const distancia = new Map<string, number>();
  const caminos = new Map<string, number>();
  const previo = new Map<string, { clave: string; accion: Accion }>();

  const claveInicio = clave(inicio.celda, inicio.orientacion);
  distancia.set(claveInicio, 0);
  caminos.set(claveInicio, 1);

  let cola: Array<{ estado: Estado; clave: string }> = [
    { estado: inicio, clave: claveInicio },
  ];
  const terminales: string[] = [];
  let distanciaMeta: number | null = null;

  while (cola.length > 0) {
    const siguienteNivel: Array<{ estado: Estado; clave: string }> = [];

    for (const actual of cola) {
      const d = distancia.get(actual.clave)!;
      // Una vez conocida la distancia mínima a la meta, no hace falta seguir
      // explorando niveles más profundos.
      if (distanciaMeta !== null && d >= distanciaMeta) continue;

      for (const accion of ACCIONES_UTILES) {
        let siguiente: Estado;
        if (accion === "AVANZAR") {
          const destino = celdaAdelante(actual.estado);
          if (!celdaTransitable(tablero, destino)) continue;
          siguiente = { ...actual.estado, celda: destino };
        } else {
          siguiente = {
            ...actual.estado,
            orientacion: girar(
              actual.estado.orientacion,
              accion === "GIRO_DERECHA_90" ? "derecha" : "izquierda",
            ),
          };
        }

        const claveSiguiente = clave(siguiente.celda, siguiente.orientacion);
        const dSiguiente = distancia.get(claveSiguiente);

        if (dSiguiente === undefined) {
          distancia.set(claveSiguiente, d + 1);
          caminos.set(claveSiguiente, caminos.get(actual.clave)!);
          previo.set(claveSiguiente, { clave: actual.clave, accion });

          if (mismaCelda(siguiente.celda, meta)) {
            // Terminal: se llegó a la meta, no se expande más desde acá.
            terminales.push(claveSiguiente);
            if (distanciaMeta === null) distanciaMeta = d + 1;
          } else {
            siguienteNivel.push({ estado: siguiente, clave: claveSiguiente });
          }
        } else if (dSiguiente === d + 1) {
          // Otro camino igual de corto hasta el mismo estado.
          caminos.set(
            claveSiguiente,
            caminos.get(claveSiguiente)! + caminos.get(actual.clave)!,
          );
        }
      }
    }

    cola = siguienteNivel;
  }

  if (distanciaMeta === null) {
    return {
      alcanzable: false,
      longitudMinima: null,
      solucionMinima: null,
      hayRectaSinGiros: false,
      solucionesMinimas: 0,
      trivial: false,
    };
  }

  const terminalesMinimos = terminales.filter(
    (k) => distancia.get(k) === distanciaMeta,
  );
  const solucionesMinimas = terminalesMinimos.reduce(
    (total, k) => total + (caminos.get(k) ?? 0),
    0,
  );

  // Reconstrucción de una solución mínima, hacia atrás desde el terminal.
  const solucionMinima: Accion[] = [];
  let cursor: string | undefined = terminalesMinimos[0];
  while (cursor && cursor !== claveInicio) {
    const paso = previo.get(cursor);
    if (!paso) break;
    solucionMinima.unshift(paso.accion);
    cursor = paso.clave;
  }

  const hayRectaSinGiros = llegaEnLineaRecta(tablero, inicio, meta);

  return {
    alcanzable: true,
    longitudMinima: distanciaMeta,
    solucionMinima,
    hayRectaSinGiros,
    solucionesMinimas,
    trivial: hayRectaSinGiros || distanciaMeta <= 1,
  };
}

/** Todas las celdas del tablero que no tienen obstáculo. */
export function celdasLibres(tablero: Tablero): Celda[] {
  const libres: Celda[] = [];
  for (let fila = 0; fila < tablero.filas; fila++) {
    for (let columna = 0; columna < tablero.columnas; columna++) {
      const celda = { fila, columna };
      if (celdaTransitable(tablero, celda)) libres.push(celda);
    }
  }
  return libres;
}

/**
 * Recorre todas las configuraciones posibles de salida, orientación y meta de un
 * tablero y devuelve la primera que cumple el criterio pedido.
 */
function buscarConfiguracion(
  tablero: Tablero,
  cumple: (analisis: AnalisisMision) => boolean,
): boolean {
  const libres = celdasLibres(tablero);
  for (const salida of libres) {
    for (const orientacion of ORIENTACIONES) {
      for (const meta of libres) {
        if (mismaCelda(salida, meta)) continue;
        if (cumple(analizarMision(tablero, { celda: salida, orientacion }, meta))) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * ¿Existe alguna combinación de salida, orientación y meta que dé una misión no
 * trivial en este tablero? Se usa en los tests de diseño de tableros.
 */
export function admiteMisionNoTrivial(tablero: Tablero): boolean {
  return buscarConfiguracion(tablero, (a) => a.alcanzable && !a.trivial);
}

/**
 * ¿Existe alguna ubicación que admita más de un recorrido válido de la misma
 * longitud? El manual pide que al menos dos de los cuatro tableros lo permitan,
 * para favorecer la comparación de soluciones distintas (sección 4.2).
 */
export function admiteVariasRutas(tablero: Tablero): boolean {
  return buscarConfiguracion(
    tablero,
    (a) => a.alcanzable && !a.trivial && a.solucionesMinimas > 1,
  );
}
