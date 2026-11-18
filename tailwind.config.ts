import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        md3: {
          surface: "#F8F9FA",
          surfaceContainer: "#EEF1F5",
          surfaceContainerHigh: "#E4E8EE",
          primary: "#0B57D0",
          onPrimary: "#FFFFFF",
          primaryContainer: "#D3E3FD",
          onPrimaryContainer: "#041E49",
          secondaryContainer: "#E8DEF8",
          onSecondaryContainer: "#1D192B",
          outline: "#747775",
          outlineVariant: "#C4C7C5"
        }
      },
      borderRadius: {
        'md3-sm': '8px',
        'md3-md': '12px',
        'md3-lg': '16px',
        'md3-xl': '28px',
        'md3-full': '9999px'
      }
    },
  },
  plugins: [],
};
export default config;
