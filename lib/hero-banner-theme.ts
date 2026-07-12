export const HERO_BANNER_THEMES = ["light", "dark"] as const;

export type HeroBannerTheme = (typeof HERO_BANNER_THEMES)[number];

function includesValue<T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.includes(value as T[number]);
}

export function isHeroBannerTheme(value: string): value is HeroBannerTheme {
  return includesValue(HERO_BANNER_THEMES, value);
}
