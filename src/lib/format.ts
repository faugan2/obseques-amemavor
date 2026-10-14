import type { ModePaiement } from '../types';
import { MODES_PAIEMENT } from '../types';

const nombre = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** 45000 -> « 45 000 » (espaces insécables, pas de coupure de ligne) */
export function montant(n: number): string {
  return nombre.format(Math.round(n)).replace(/\s/g, ' ');
}

export function fcfa(n: number): string {
  return `${montant(n)} FCFA`;
}

export function signe(n: number, sens: '+' | '-'): string {
  return `${sens === '+' ? '+' : '−'}${montant(n)}`;
}

/** Saisie « 25 000 » ou « 25000 » -> 25000 ; renvoie NaN si invalide. */
export function lireMontant(saisie: string): number {
  const propre = saisie.replace(/[\s  .]/g, '').replace(/fcfa/i, '');
  if (propre === '') return NaN;
  if (!/^\d+$/.test(propre)) return NaN;
  return Number(propre);
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** « 2026-10-12 » -> « 12 oct. 2026 » */
export function dateLongue(iso: string): string {
  const [a, m, j] = iso.split('-').map(Number);
  if (!a || !m || !j) return iso;
  return `${j} ${MOIS[m - 1]} ${a}`;
}

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « 2026-10-28 » -> « Mercredi 28 octobre » */
export function jourLong(iso: string): string {
  const [a, m, j] = iso.split('-').map(Number);
  if (!a || !m || !j) return iso;
  const d = new Date(a, m - 1, j);
  return `${JOURS[d.getDay()]} ${j} ${MOIS_LONGS[m - 1]}`;
}

/** « 70 01 75 26 » -> « tel:+22870017526 » (numéros togolais à 8 chiffres). */
export function lienTelephone(numero: string): string {
  const chiffres = numero.replace(/\D/g, '');
  return chiffres.length === 8 ? `tel:+228${chiffres}` : `tel:${chiffres}`;
}

/** « 2026-10-12 » -> « 12/10/2026 » */
export function dateCourte(iso: string): string {
  const [a, m, j] = iso.split('-');
  return a && m && j ? `${j}/${m}/${a}` : iso;
}

export function dateHeure(ms: number): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()} à ${h} h ${mi}`;
}

export function aujourdHui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function libelleMode(m: ModePaiement): string {
  return MODES_PAIEMENT.find((x) => x.valeur === m)?.libelle ?? m;
}

/** Pour la recherche : minuscules, sans accents. */
export function pourRecherche(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
}
