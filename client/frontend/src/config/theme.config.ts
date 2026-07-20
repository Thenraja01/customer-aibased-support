export const themeConfig = {
  defaultTheme: 'light',
  storageKey: 'theme',
  fonts: {
    sans: '"Inter Variable", system-ui, sans-serif',
    display: '"IBM Plex Sans Variable", system-ui, sans-serif',
    serif: 'Merriweather, Georgia, serif',
    mono: '"Source Sans 3 Variable", monospace',
  },
  colors: {
    primary: {
      DEFAULT: 'hsl(38, 80%, 50%)',
      foreground: 'hsl(0, 0%, 100%)',
    },
    destructive: {
      DEFAULT: 'hsl(0, 72%, 51%)',
      foreground: 'hsl(0, 0%, 98%)',
    },
  },
  sidebar: {
    width: '16rem',
    collapsedWidth: '4rem',
  },
} as const;
