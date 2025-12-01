export type BorderThemeCategory =
  | "Holiday"
  | "Special Occasions"
  | "Futuristic"
  | "Seasonal";

export interface BorderTheme {
  readonly id: string;
  readonly name: string;
  readonly category: BorderThemeCategory;
  readonly preview: string;
  readonly description: string;
  readonly message: string;
}

export const BORDER_THEMES: readonly BorderTheme[] = [] as const;

export function getBorderThemesByCategory(category: BorderThemeCategory): readonly BorderTheme[] {
  return BORDER_THEMES.filter((theme) => theme.category === category);
}

export const BORDER_THEME_BY_ID: ReadonlyMap<string, BorderTheme> = new Map(
  BORDER_THEMES.map((theme) => [theme.id, theme] as const)
);
