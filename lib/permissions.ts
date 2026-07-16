export const PERMISSIONS = [
  "product.view",
  "product.create",
  "product.update",
  "product.delete",
  "category.view",
  "category.create",
  "category.update",
  "category.delete",
  "order.view",
  "order.update",
  "order.paymentUpload.review",
  "settings.view",
  "settings.update",
  "career.view",
  "career.manage",
  "download.view",
  "download.manage",
  "page.view",
  "page.manage",
  "payment-gateway.view",
  "payment-gateway.update",
  "admin.manage",
  "hero-banner.view",
  "hero-banner.manage",
  "home-section.view",
  "home-section.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}

export function isPermission(value: string): value is Permission {
  return includesValue(PERMISSIONS, value);
}

export const PERMISSION_GROUPS: { label: string; keys: Permission[] }[] = [
  { label: "Products", keys: ["product.view", "product.create", "product.update", "product.delete"] },
  { label: "Categories", keys: ["category.view", "category.create", "category.update", "category.delete"] },
  { label: "Orders", keys: ["order.view", "order.update", "order.paymentUpload.review"] },
  { label: "Settings", keys: ["settings.view", "settings.update"] },
  { label: "Content", keys: ["career.view", "career.manage", "download.view", "download.manage", "page.view", "page.manage"] },
  { label: "Payment gateways", keys: ["payment-gateway.view", "payment-gateway.update"] },
  { label: "Hero banners", keys: ["hero-banner.view", "hero-banner.manage"] },
  { label: "Home sections", keys: ["home-section.view", "home-section.manage"] },
  { label: "Team", keys: ["admin.manage"] },
];
