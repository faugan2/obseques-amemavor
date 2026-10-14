// Icônes au trait (stroke) — décoratives par défaut (aria-hidden).
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { taille?: number };

function Base({ taille = 20, children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconeFlecheHaut = (p: P) => <Base {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Base>;
export const IconeFlecheBas = (p: P) => <Base {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></Base>;
export const IconeHorloge = (p: P) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>;
export const IconeCadeau = (p: P) => <Base {...p}><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></Base>;
export const IconeSac = (p: P) => <Base {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /></Base>;
export const IconePersonnes = (p: P) => <Base {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Base>;
export const IconeMaison = (p: P) => <Base {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Base>;
export const IconeRetour = (p: P) => <Base {...p}><path d="M15 18l-6-6 6-6" /></Base>;
export const IconeRecherche = (p: P) => <Base {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Base>;
export const IconeDocument = (p: P) => <Base {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></Base>;
export const IconeAppareil = (p: P) => <Base {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></Base>;
export const IconeCoche = (p: P) => <Base {...p}><path d="M20 6L9 17l-5-5" /></Base>;
export const IconeCroix = (p: P) => <Base {...p}><path d="M18 6L6 18M6 6l12 12" /></Base>;
export const IconeAnnuler = (p: P) => <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></Base>;
export const IconeCrayon = (p: P) => <Base {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Base>;
export const IconeTableau = (p: P) => <Base {...p}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></Base>;
export const IconeHistorique = (p: P) => <Base {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></Base>;
export const IconeReglages = (p: P) => <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Base>;
export const IconeCadenas = (p: P) => <Base {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Base>;
export const IconeAlerte = (p: P) => <Base {...p}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></Base>;
export const IconeMenu = (p: P) => <Base {...p}><path d="M3 12h18M3 6h18M3 18h18" /></Base>;
export const IconeBouteille = (p: P) => <Base {...p}><path d="M9 2h6M10 2v4l-2 3v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9l-2-3V2M8 13h8" /></Base>;
export const IconeAssiette = (p: P) => <Base {...p}><path d="M3 11h18a9 9 0 0 1-18 0zM7 7c0-2 2-2 2-4M12 7c0-2 2-2 2-4" /></Base>;
export const IconeChaise = (p: P) => <Base {...p}><path d="M5 12V4h4v8M15 12V4h4v8M3 12h18v3H3zM6 15v6M18 15v6" /></Base>;
export const IconeCamion = (p: P) => <Base {...p}><rect x="1" y="6" width="15" height="10" rx="1" /><path d="M16 9h4l3 3v4h-7" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></Base>;
export const IconeBoite = (p: P) => <Base {...p}><path d="M21 16V8l-9-5-9 5v8l9 5zM3.3 7L12 12l8.7-5M12 22V12" /></Base>;
export const IconePoints = (p: P) => <Base {...p}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Base>;
export const IconeCoeur = (p: P) => <Base {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" /></Base>;
export const IconeImprimante = (p: P) => <Base {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Base>;
export const IconeTelecharger = (p: P) => <Base {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Base>;
export const IconeBudget = (p: P) => <Base {...p}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" rx="0.5" /><rect x="12" y="8" width="3" height="10" rx="0.5" /><rect x="17" y="5" width="3" height="13" rx="0.5" /></Base>;
export const IconeCorbeille = (p: P) => <Base {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></Base>;
export const IconePersonne = (p: P) => <Base {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Base>;

/** Colombe en vol portant un rameau d'olivier (symbole de paix). */
export function IconeColombe({ taille = 22, ...p }: P) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      <path d="M3.5 13.2 L6.4 12.4 C7.3 10.3 10 10.1 11.2 12.3 C13 15.4 17 16.3 21.5 15.2 L28.5 12.8 L25.6 17.2 C22.8 20.4 17.6 22.3 12.6 21.4 C8.9 20.7 6.6 17.8 6.5 14.6" />
      <path d="M12.2 13.6 C13.2 8.4 17.4 4.8 25 3.8 C23.4 8.4 20.6 11.6 16.6 14.6" />
      <circle cx="8.6" cy="12.6" r="0.6" fill="currentColor" stroke="none" />
      <path d="M4.4 13.6 C3.9 15.6 3.2 17.2 2.2 18.6" />
      <path d="M3.4 16.2 C2.1 16 1.4 16.8 1.3 17.6 C2.4 17.8 3.2 17.3 3.4 16.2Z" fill="currentColor" />
    </svg>
  );
}

/** Icône associée à une catégorie de don ou de dépense. */
export function IconeCategorie({ categorie, ...p }: P & { categorie: string }) {
  const c = categorie.toLowerCase();
  if (c.includes('boisson')) return <IconeBouteille {...p} />;
  if (c.includes('nourriture') || c.includes('repas')) return <IconeAssiette {...p} />;
  if (c.includes('chaise') || c.includes('bâche') || c.includes('matériel') || c.includes('location')) return <IconeChaise {...p} />;
  if (c.includes('transport')) return <IconeCamion {...p} />;
  if (c.includes('hébergement')) return <IconeMaison {...p} />;
  if (c.includes('logistique')) return <IconeBoite {...p} />;
  if (c.includes('impression') || c.includes('communication')) return <IconeDocument {...p} />;
  return <IconePoints {...p} />;
}
