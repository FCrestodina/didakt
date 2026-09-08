import {
  ORIENTACIONES,
  type Accion,
  type Celda,
  type Estado,
  type MotivoFin,
  type Orientacion,
  type PasoEjecucion,
  type ResultadoEjecucion,
  type Tablero,
} from "./tipos";

/**
 * Motor de movimiento sobre grilla.
 *
 * Reglas (manual del Creador de misiones, sección 11; manual del Robot, sección 16):
 *  - AVANZAR mueve exactamente una celda en la dirección hacia la que está
 *    orientado el dispositivo.
 *  - Los giros rotan 90° sin cambiar de celda.
 *  - DETENER finaliza la ejecución en la posición actual.
 *  - El desplazamiento es ortogonal: no hay diagonales.
 *  - No hay interpretación contextual: cada acción hace siempre lo mismo.
 *
 * La ejecución es determinística: misma secuencia + mismo estado inicial =
 * mismo resultado, siempre.
 */

/** Desplazamiento de una celda según la orientación. La fila crece hacia abajo. */
const DELTA: Record<Orientacion, { fila: number; columna: number }> = {
  NORTE: { fila: -1, columna: 0 },
  ESTE: { fila: 0, columna: 1 },
  SUR: { fila: 1, columna: 0 },
  OESTE: { fila: 0, columna: -1 },
};

export function mismaCelda(a: Celda, b: Celda): boolean {
  return a.fila === b.fila && a.columna === b.columna;
}

/**
 * Gira 90°. El sentido se calcula sobre la orientación del dispositivo,
 * no sobre la pantalla: si el dispositivo mira al SUR, su derecha es el OESTE.
 */
export function girar(
  orientacion: Orientacion,
  sentido: "derecha" | "izquierda",
): Orientacion {
  const i = ORIENTACIONES.indexOf(orientacion);
  const paso = sentido === "derecha" ? 1 : -1;
  return ORIENTACIONES[(i + paso + ORIENTACIONES.length) % ORIENTACIONES.length];
}

/** Celda inmediatamente adelante del dispositivo, exista o no en el tablero. */
export function celdaAdelante(estado: Estado): Celda {
  const d = DELTA[estado.orientacion];
  return {
    fila: estado.celda.fila + d.fila,
    columna: estado.celda.columna + d.columna,
  };
}

export function dentroDelTablero(tablero: Tablero, celda: Celda): boolean {
  return (
    celda.fila >= 0 &&
    celda.fila < tablero.filas &&
    celda.columna >= 0 &&
    celda.columna < tablero.columnas
  );
}

export function esObstaculo(tablero: Tablero, celda: Celda): boolean {
  return tablero.obstaculos.some((o) => mismaCelda(o, celda));
}

/** Una celda es transitable si está dentro del tablero y no tiene obstáculo. */
export function celdaTransitable(tablero: Tablero, celda: Celda): boolean {
  return dentroDelTablero(tablero, celda) && !esObstaculo(tablero, celda);
}

/**
 * Aplica una acción y devuelve el estado resultante, o null si el entorno la
 * bloqueó. Un bloqueo no es un error de la instrucción: la acción se reconoce
 * como válida, pero el movimiento no puede realizarse.
 */
function aplicarAccion(
  tablero: Tablero,
  estado: Estado,
  accion: Accion,
): { estado: Estado; bloqueo: "OBSTACULO" | "FUERA_DEL_TABLERO" | null } {
  switch (accion) {
    case "GIRO_DERECHA_90":
      return {
        estado: { ...estado, orientacion: girar(estado.orientacion, "derecha") },
        bloqueo: null,
      };
    case "GIRO_IZQUIERDA_90":
      return {
        estado: {
          ...estado,
          orientacion: girar(estado.orientacion, "izquierda"),
        },
        bloqueo: null,
      };
    case "DETENER":
      return { estado, bloqueo: null };
    case "AVANZAR": {
      const destino = celdaAdelante(estado);
      if (!dentroDelTablero(tablero, destino)) {
        return { estado, bloqueo: "FUERA_DEL_TABLERO" };
      }
      if (esObstaculo(tablero, destino)) {
        return { estado, bloqueo: "OBSTACULO" };
      }
      return { estado: { ...estado, celda: destino }, bloqueo: null };
    }
  }
}

/**
 * Ejecuta una secuencia completa paso a paso.
 *
 * Corta en el primer bloqueo, en el primer DETENER, o al entrar en la celda-meta.
 * Entrar en la meta termina la ejecución con éxito aunque queden acciones
 * pendientes: el criterio es alcanzar la meta, no consumir toda la secuencia.
 *
 * Nunca se compara contra una secuencia modelo. Dos secuencias distintas que
 * llegan a la meta son ambas válidas.
 */
export function ejecutarSecuencia(
  tablero: Tablero,
  inicio: Estado,
  meta: Celda,
  secuencia: readonly Accion[],
): ResultadoEjecucion {
  const pasos: PasoEjecucion[] = [];
  let estado: Estado = { celda: { ...inicio.celda }, orientacion: inicio.orientacion };
  let motivo: MotivoFin = "SECUENCIA_COMPLETA";
  let accionesAplicadas = 0;
  let indiceBloqueo: number | null = null;

  // El caso límite de arrancar ya sobre la meta se resuelve antes de ejecutar nada.
  if (mismaCelda(estado.celda, meta)) {
    return {
      pasos,
      estadoFinal: estado,
      motivo: "META_ALCANZADA",
      accionesAplicadas: 0,
      indiceBloqueo: null,
      exito: true,
    };
  }

  for (let indice = 0; indice < secuencia.length; indice++) {
    const accion = secuencia[indice];
    const estadoPrevio = estado;
    const { estado: siguiente, bloqueo } = aplicarAccion(tablero, estado, accion);

    if (bloqueo) {
      pasos.push({
        indice,
        accion,
        estadoPrevio,
        estadoPosterior: estadoPrevio,
        aplicada: false,
      });
      motivo = bloqueo;
      indiceBloqueo = indice;
      break;
    }

    estado = siguiente;
    accionesAplicadas++;
    pasos.push({
      indice,
      accion,
      estadoPrevio,
      estadoPosterior: estado,
      aplicada: true,
    });

    if (accion === "DETENER") {
      motivo = mismaCelda(estado.celda, meta) ? "META_ALCANZADA" : "DETENIDO";
      break;
    }

    if (mismaCelda(estado.celda, meta)) {
      motivo = "META_ALCANZADA";
      break;
    }
  }

  return {
    pasos,
    estadoFinal: estado,
    motivo,
    accionesAplicadas,
    indiceBloqueo,
    exito: motivo === "META_ALCANZADA",
  };
}

/**
 * Expande "avanzá N" a N acciones AVANZAR.
 *
 * El manual del Robot (sección 16) exige ejecutarlo paso a paso, para poder
 * frenar en el último casillero válido e informar cuántos movimientos se
 * ejecutaron y por qué se detuvo.
 */
export function expandirAvanzar(cantidad: number): Accion[] {
  return Array.from({ length: Math.max(0, Math.trunc(cantidad)) }, () => "AVANZAR" as const);
}
