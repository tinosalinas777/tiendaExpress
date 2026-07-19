// Número de WhatsApp del negocio, formato internacional sin "+" ni espacios
// (ej. 54 9 11 1234-5678 -> "5491112345678"). Se usa en el botón flotante,
// el checkout y la página de contacto — cambialo acá una sola vez.
export const WHATSAPP_NUMBER = "5491127227613"; // <- PONÉ ACÁ TU NÚMERO REAL

export function buildWhatsappLink(message = "") {
  return `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// =========================================================
// Suscripción (vos cobrándole a este cliente el servicio mensual)
// =========================================================
// Este es TU número de WhatsApp (el desarrollador/revendedor), no el del
// negocio — es a donde te llega el aviso cuando el cliente dice "ya
// transferí". Va a ser distinto en cada tienda que repliques.
export const DEVELOPER_WHATSAPP_NUMBER = "5491127227613"; // <- TODAVÍA ES EL NÚMERO DE EJEMPLO, PONÉ EL TUYO

export function buildDeveloperWhatsappLink(message = "") {
  return `https://wa.me/${DEVELOPER_WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

// Datos para que el cliente te transfiera manualmente. El precio "real" que
// se cobra vive en la tabla `subscription` de Supabase (columna `price`) —
// esto es solo para mostrar los datos bancarios en la pantalla de pago.
export const BANK_TRANSFER_DETAILS = {
  titular: "Cristian Damian Salinas",
  cbu: "0000003100000360204786",
  alias: "fuga.agites.pelo.mp",
  banco: "Mercadopago",
};
