// Número de WhatsApp del negocio, formato internacional sin "+" ni espacios
// (ej. 54 9 11 1234-5678 -> "5491112345678"). Se usa en el botón flotante,
// el checkout y la página de contacto — cambialo acá una sola vez.
export const WHATSAPP_NUMBER = "5491127227613"; // <- PONÉ ACÁ TU NÚMERO REAL

export function buildWhatsappLink(message = "") {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
