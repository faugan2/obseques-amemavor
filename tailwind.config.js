/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        foret: { DEFAULT: '#0F2A22', clair: '#1E3F34' },
        or: { DEFAULT: '#C8A24A', clair: '#E9D9A8', fonce: '#6E5418' },
        fond: '#F3F4F0',
        encre: { DEFAULT: '#14201B', douce: '#3E4A44', pale: '#5A6660' },
        trait: '#EDEEE9',
        bord: '#D0D4CC',
        recu: { DEFAULT: '#17694F', fonce: '#0F4A37', pale: '#E3F1EA' },
        depense: { DEFAULT: '#B4472A', fonce: '#8E3218', pale: '#FBE9E3' },
        attente: { DEFAULT: '#6E4A00', fonce: '#4F3500', pale: '#FCF1D8', barre: '#E2B652' },
        nature: { DEFAULT: '#5B3C8C', fonce: '#3F2867', pale: '#EFE8F7' },
      },
      fontFamily: {
        titre: ['"DM Serif Display"', 'Georgia', 'serif'],
        corps: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(15,42,34,0.06)',
        flottante: '0 1px 2px rgba(15,42,34,0.06), 0 12px 32px rgba(15,42,34,0.10)',
      },
    },
  },
  plugins: [],
};
