export const theme = {
  colors: {
    primary: 'hsl(38, 80%, 50%)',
    primaryForeground: 'hsl(0, 0%, 100%)',
    destructive: 'hsl(0, 72%, 51%)',
    destructiveForeground: 'hsl(0, 0%, 98%)',
  },
  fonts: {
    sans: '"Inter Variable", system-ui, sans-serif',
    display: '"IBM Plex Sans Variable", system-ui, sans-serif',
    serif: 'Merriweather, Georgia, serif',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;
