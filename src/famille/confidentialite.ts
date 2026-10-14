// Options de confidentialité choisies par l'administrateur (Paramètres).
// Masquage à l'affichage : voir la limite expliquée dans le README.
import type { Contribution, Parametres } from '../types';

/** Associe à chaque contributeur un numéro stable (ordre de première contribution). */
export function numerosContributeurs(contributions: Contribution[]): Map<string, number> {
  const tri = [...contributions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const map = new Map<string, number>();
  for (const c of tri) if (!map.has(c.contributeurCle)) map.set(c.contributeurCle, map.size + 1);
  return map;
}

export function nomPublic(nom: string, cle: string, parametres: Parametres, numeros: Map<string, number>): string {
  if (parametres.afficherNoms) return nom;
  return `Contributeur n° ${numeros.get(cle) ?? '?'}`;
}
