"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Captura de voz del Robot mensajero.
 *
 * Usa el reconocimiento de voz del propio navegador (Web Speech API). No hay
 * servidor propio de audio: el recurso no graba, no guarda y no envía archivos
 * de audio a ningún backend de esta aplicación.
 *
 * Condiciones que impone el manual (sección 5 y sección 12):
 *  - El micrófono se activa únicamente por una acción explícita del usuario.
 *  - Una intervención por vez. No hay escucha continua en segundo plano.
 *  - Idioma español de Argentina cuando la plataforma lo permite.
 *  - Si la confianza técnica es insuficiente o la transcripción está vacía, no
 *    se ejecuta ninguna acción: es una falla de reconocimiento, no un error de
 *    la instrucción del estudiante.
 *
 * IMPORTANTE para el informe de compatibilidad: en Chrome y Edge esta API
 * procesa el audio en servidores del proveedor del navegador, no en el
 * dispositivo. La entrada por texto es siempre una alternativa equivalente.
 */

/** Umbral por debajo del cual la transcripción se considera poco confiable. */
export const CONFIANZA_MINIMA = 0.5;

export const IDIOMA = "es-AR";

interface ResultadoReconocimiento {
  transcripcion: string;
  confianza: number;
}

type EstadoVoz = "inactivo" | "capturando" | "procesando";

/** Motivo por el cual la captura no produjo una transcripción utilizable. */
export type FallaVoz =
  | "SIN_SOPORTE"
  | "PERMISO_DENEGADO"
  | "SIN_AUDIO"
  | "CONFIANZA_BAJA"
  | "ERROR_TECNICO";

export const MENSAJE_FALLA: Record<FallaVoz, string> = {
  SIN_SOPORTE:
    "Este navegador no ofrece reconocimiento de voz. Escribí la instrucción en el cuadro de texto.",
  PERMISO_DENEGADO:
    "El navegador no habilitó el micrófono. Escribí la instrucción o revisá los permisos del sitio.",
  SIN_AUDIO: "No se pudo reconocer lo dicho. Probá nuevamente o escribí la instrucción.",
  CONFIANZA_BAJA: "No se pudo reconocer lo dicho. Probá nuevamente o escribí la instrucción.",
  ERROR_TECNICO: "No se pudo reconocer lo dicho. Probá nuevamente o escribí la instrucción.",
};

/* Tipos mínimos de la Web Speech API, que no vienen en las definiciones estándar. */
interface SpeechRecognitionAlternativaLike {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativaLike;
  length: number;
}
interface SpeechRecognitionEventLike {
  results: { 0: SpeechRecognitionResultLike; length: number };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
}
type ConstructorReconocimiento = new () => SpeechRecognitionLike;

function obtenerConstructor(): ConstructorReconocimiento | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: ConstructorReconocimiento;
    webkitSpeechRecognition?: ConstructorReconocimiento;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function soportaReconocimientoDeVoz(): boolean {
  return obtenerConstructor() !== null;
}

/** El soporte del navegador no cambia durante la sesión: no hay a qué suscribirse. */
function suscripcionVacia(): () => void {
  return () => {};
}

export function useReconocimientoDeVoz({
  onTranscripcion,
  onFalla,
}: {
  onTranscripcion: (resultado: ResultadoReconocimiento) => void;
  onFalla: (falla: FallaVoz) => void;
}) {
  const [estado, setEstado] = useState<EstadoVoz>("inactivo");
  const reconocimientoRef = useRef<SpeechRecognitionLike | null>(null);
  // Cada captura o falla resuelve una sola vez, aunque el navegador dispare
  // onerror y onend seguidos.
  const resueltoRef = useRef(false);

  // El soporte solo se puede consultar en el cliente. En el servidor la
  // respuesta es siempre "no", así que el HTML inicial coincide con el del
  // navegador y no hay diferencia de hidratación.
  const soportado = useSyncExternalStore(
    suscripcionVacia,
    soportaReconocimientoDeVoz,
    () => false,
  );

  const detener = useCallback(() => {
    reconocimientoRef.current?.stop();
  }, []);

  const capturar = useCallback(() => {
    const Constructor = obtenerConstructor();
    if (!Constructor) {
      onFalla("SIN_SOPORTE");
      return;
    }
    // Una intervención por vez: si ya hay una captura abierta, no se abre otra.
    if (reconocimientoRef.current) return;

    const reconocimiento = new Constructor();
    reconocimiento.lang = IDIOMA;
    reconocimiento.continuous = false;
    reconocimiento.interimResults = false;
    reconocimiento.maxAlternatives = 1;

    resueltoRef.current = false;
    reconocimientoRef.current = reconocimiento;
    setEstado("capturando");

    reconocimiento.onresult = (evento) => {
      const alternativa = evento.results[0]?.[0];
      const transcripcion = (alternativa?.transcript ?? "").trim();
      // Algunos navegadores devuelven confianza 0 cuando no la calculan; en ese
      // caso mandamos lo que haya y decide el módulo de interpretación.
      const confianza = alternativa?.confidence ?? 0;

      resueltoRef.current = true;
      setEstado("procesando");

      if (!transcripcion) {
        onFalla("SIN_AUDIO");
        return;
      }
      if (confianza > 0 && confianza < CONFIANZA_MINIMA) {
        onFalla("CONFIANZA_BAJA");
        return;
      }
      onTranscripcion({ transcripcion, confianza });
    };

    reconocimiento.onerror = (evento) => {
      if (resueltoRef.current) return;
      resueltoRef.current = true;
      if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
        onFalla("PERMISO_DENEGADO");
      } else if (evento.error === "no-speech" || evento.error === "audio-capture") {
        onFalla("SIN_AUDIO");
      } else if (evento.error !== "aborted") {
        onFalla("ERROR_TECNICO");
      }
    };

    reconocimiento.onend = () => {
      reconocimientoRef.current = null;
      setEstado("inactivo");
      if (!resueltoRef.current) {
        resueltoRef.current = true;
        onFalla("SIN_AUDIO");
      }
    };

    try {
      reconocimiento.start();
    } catch {
      reconocimientoRef.current = null;
      setEstado("inactivo");
      onFalla("ERROR_TECNICO");
    }
  }, [onFalla, onTranscripcion]);

  // Al salir de la pantalla se corta cualquier captura abierta: nunca queda el
  // micrófono escuchando en segundo plano.
  useEffect(() => {
    return () => {
      reconocimientoRef.current?.abort();
      reconocimientoRef.current = null;
    };
  }, []);

  return { estado, soportado, capturar, detener };
}
