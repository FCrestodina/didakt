// Con muchas condiciones el texto del QR crece y los módulos se achican. Bajar la
// corrección de error de H a M lo mantiene legible impreso en 5 cm; los QR cortos
// siguen en H, como siempre.
export function nivelQR(texto: string): "H" | "M" {
  return texto.length > 120 ? "M" : "H";
}

// Descarga como PNG el QR dibujado en el <canvas> que hay dentro de `contenedor`.
export function descargarQR(contenedor: HTMLElement | null, nombre: string) {
  const canvas = contenedor?.querySelector("canvas");
  if (!canvas) return;
  const a = document.createElement("a");
  a.download = `qr-${nombre.trim().replace(/[^\w\-]+/g, "_").toLowerCase()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}
