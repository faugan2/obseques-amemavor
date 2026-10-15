// Validation côté client (la même logique est vérifiée côté serveur dans firestore.rules).
import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indiquez une date valide.');
const entier = (msg: string) => z.number({ invalid_type_error: msg }).int(msg).min(0, msg).max(1_000_000_000, 'Montant trop élevé.');
const mode = z.enum(['especes', 'mobile_money', 'virement', 'autre']);
const texte = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const requis = (max: number, msg: string) => z.string().trim().min(1, msg).max(max, `${max} caractères maximum.`);

export const schemaContribution = z
  .object({
    type: z.enum(['cotisation', 'participation']),
    groupe: texte(80),
    contributeur: requis(120, 'Indiquez le nom du contributeur.'),
    contributeurCle: z.string().min(1),
    date,
    montant: entier('Saisissez un montant en FCFA (nombre entier).').refine((v) => v > 0, 'Le montant doit être supérieur à zéro.'),
    montantRecu: entier('Saisissez la somme reçue en FCFA (nombre entier).'),
    mode,
    motif: texte(120),
    reference: texte(120),
    commentaire: texte(1000),
  })
  .refine((c) => c.montantRecu <= c.montant, { path: ['montantRecu'], message: 'La somme reçue ne peut pas dépasser le montant promis.' });

export const schemaDon = z.object({
  donateur: requis(120, 'Indiquez le nom du donateur.'),
  donateurCle: z.string().min(1),
  date,
  categorie: requis(80, 'Choisissez une catégorie.'),
  nature: requis(200, 'Décrivez le bien ou le service.'),
  quantite: z.number({ invalid_type_error: 'Indiquez une quantité.' }).positive('La quantité doit être supérieure à zéro.').max(1_000_000),
  unite: requis(40, "Indiquez l'unité."),
  statut: z.enum(['annonce', 'partiel', 'recu']),
  valeurEstimee: entier('Valeur estimée invalide.').nullable(),
  observations: texte(1000),
});

export const schemaDepense = z
  .object({
    date,
    designation: requis(200, 'Indiquez la désignation de la dépense.'),
    posteId: z.string().max(100),
    categorie: requis(200, 'Choisissez le poste du budget.'),
    responsable: texte(120),
    financement: texte(120),
    montant: entier('Saisissez le montant total en FCFA (nombre entier).').refine((v) => v >= 0, 'Le montant doit être supérieur ou égal à zéro.'),
    montantPaye: entier('Saisissez la somme payée en FCFA (nombre entier).'),
    statut: z.enum(['prevue', 'partielle', 'payee']),
    beneficiaire: texte(200),
    mode,
    reference: texte(120),
    justificatif: z.object({ chemin: z.string(), nom: z.string(), type: z.string() }).nullable(),
    commentaire: texte(1000),
  })
  .refine((d) => d.montantPaye <= d.montant, {
    path: ['montantPaye'],
    message: 'Le montant payé ne peut pas dépasser le montant total.',
  })
  .refine((d) => d.statut !== 'partielle' || (d.montantPaye > 0 && d.montantPaye < d.montant), {
    path: ['montantPaye'],
    message: 'Pour un paiement partiel, la somme payée doit être entre 0 et le montant total.',
  });

export const schemaPoste = z.object({
  libelle: requis(200, 'Indiquez le nom du poste.'),
  prevision: entier('Saisissez le montant prévu en FCFA (nombre entier, 0 si non chiffré).'),
  responsable: texte(120),
  financement: texte(120),
  commentaire: texte(1000),
  ordre: z.number().int(),
});

export const schemaDevis = z.object({
  prestataire: requis(200, 'Indiquez le nom du prestataire.'),
  posteId: z.string().max(100),
  objet: texte(300),
  montant: entier('Saisissez le montant du devis en FCFA (nombre entier).').refine((v) => v > 0, 'Le montant doit être supérieur à zéro.'),
  date,
  statut: z.enum(['recu', 'retenu', 'refuse']),
  reference: texte(120),
  commentaire: texte(1000),
});

export const schemaEmprunt = z
  .object({
    preteur: requis(120, 'Indiquez le nom du prêteur.'),
    montant: entier('Saisissez le montant emprunté en FCFA (nombre entier).').refine((v) => v > 0, 'Le montant doit être supérieur à zéro.'),
    date,
    dateRemboursement: date.optional(),
    montantRembourse: entier('Saisissez le montant remboursé en FCFA (nombre entier).'),
    statut: z.enum(['annonce', 'partielle', 'rembourse']),
    mode,
    reference: texte(120),
    commentaire: texte(1000),
  })
  .refine((e) => e.montantRembourse <= e.montant, {
    path: ['montantRembourse'],
    message: 'Le montant remboursé ne peut pas dépasser le montant emprunté.',
  });

export const schemaLibelle = z.object({
  nom: requis(120, 'Indiquez le nom du libellé.'),
  description: texte(500),
  ordre: z.number().int(),
});

/** Transforme les erreurs zod en { champ: message }. */
export function erreursParChamp(e: z.ZodError): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of e.issues) {
    const cle = String(i.path[0] ?? 'general');
    if (!r[cle]) r[cle] = i.message;
  }
  return r;
}
