import {
  BORDER_THEME_BY_ID,
  BORDER_THEMES,
  BorderTheme,
  BorderThemeCategory,
  getBorderThemesByCategory,
} from "../../../shared/border-themes";

export type { BorderTheme, BorderThemeCategory } from "../../../shared/border-themes";

export const borderService = {
  getAll(): readonly BorderTheme[] {
    return BORDER_THEMES;
  },

  getByCategory(category: BorderThemeCategory): readonly BorderTheme[] {
    return getBorderThemesByCategory(category);
  },

  getCategories(): readonly BorderThemeCategory[] {
    const categories = new Set<BorderThemeCategory>();
    for (const theme of BORDER_THEMES) {
      categories.add(theme.category);
    }
    return Array.from(categories);
  },

  getById(id: string): BorderTheme | undefined {
    return BORDER_THEME_BY_ID.get(id);
  },
};
