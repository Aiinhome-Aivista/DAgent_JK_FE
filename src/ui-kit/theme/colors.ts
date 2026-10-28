export const themes = {
  default: {
    bg: '#ffffff',
    surface: '#f9fafb',
    surfaceHover: '#f3f4f6',
    border: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  }
};

export type ThemeType = keyof typeof themes;
