import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        md3: {
          primary: '#6750A4',
          onPrimary: '#FFFFFF',
          primaryContainer: '#EADDFF',
          onPrimaryContainer: '#21005D',
          secondary: '#625B71',
          onSecondary: '#FFFFFF',
          secondaryContainer: '#E8DEF8',
          onSecondaryContainer: '#1D192B',
          tertiary: '#7D5260',
          tertiaryContainer: '#FFD8E4',
          onTertiaryContainer: '#31111D',
          surface: '#FEF7FF',
          surfaceContainerLowest: '#FFFFFF',
          surfaceContainerLow: '#F7F2FA',
          surfaceContainer: '#F3EDF7',
          surfaceContainerHigh: '#ECE6F0',
          surfaceContainerHighest: '#E6E0E9',
          onSurface: '#1D1B20',
          onSurfaceVariant: '#49454F',
          outline: '#79747E',
          outlineVariant: '#CAC4D0'
        }
      },
      borderRadius: {
        'md3-sm': '8px',
        'md3-md': '12px',
        'md3-lg': '16px',
        'md3-xl': '28px',
        'md3-full': '9999px'
      }
    }
  },
  plugins: []
};
export default config;
