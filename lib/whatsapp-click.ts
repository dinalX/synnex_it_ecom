export const WHATSAPP_CLICK_KINDS = ["technical", "bulk"] as const;
export const WHATSAPP_CLICK_SERVICES = ["pos", "barcode", "security"] as const;

export type WhatsappClickKind = (typeof WHATSAPP_CLICK_KINDS)[number];
export type WhatsappClickService = (typeof WHATSAPP_CLICK_SERVICES)[number];

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}

export function isWhatsappClickKind(value: string): value is WhatsappClickKind {
  return includesValue(WHATSAPP_CLICK_KINDS, value);
}

export function isWhatsappClickService(value: string): value is WhatsappClickService {
  return includesValue(WHATSAPP_CLICK_SERVICES, value);
}
