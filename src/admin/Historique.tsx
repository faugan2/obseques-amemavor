import { useEffect, useState } from 'react';
import { GabaritAdmin } from './Gabarit';
import { Chargement, MessageErreur, classes } from '../composants/ui';
import { IconeAnnuler, IconeCrayon, IconeReglages } from '../composants/icones';
import { db } from '../lib/firebase';
import { nomCollection } from '../lib/espace';
import { dateHeure, montant } from '../lib/format';
import type { ActionHistorique, EntreeHistorique } from '../types';

const LIBELLES_CHAMPS: Record<string, string> = {
  contributeur: 'Contributeur',
  donateur: 'Donateur',
  date: 'Date',
  montant: 'Montant',
  montantRecu: 'Montant reçu',
  montantPaye: 'Montant payé',
  mode: 'Mode',
  motif: 'Motif',
  reference: 'Référence',
  commentaire: 'Commentaire',
  categorie: 'Catégorie',
  nature: 'Nature',
  quantite: 'Quantité',
  unite: 'Unité',
  statut: 'Statut',
  valeurEstimee: 'Valeur estimée',
  observations: 'Observations',
  designation: 'Désignation',
  beneficiaire: 'Bénéficiaire',
  justificatif: 'Justificatif',
  annule: 'Annulée',
  cloture: 'Clôture',
  afficherNoms: 'Afficher les noms',
  afficherMontants: 'Afficher les montants',
  afficherJustificatifs: 'Afficher les justificatifs',
  nomDefunt: 'Nom affiché',
  dates: 'Dates',
  citation: 'Citation',
  texteAccueil: "Texte d'accueil",
  photoUrl: 'Photo',
  ceremonies: 'Cérémonies',
  infoSalutations: 'Salutations',
  telephoneContact: 'Téléphone de contact',
};

const CHAMPS_CACHES = new Set(['contributeurCle', 'donateurCle']);

function valeurLisible(cle: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'oui' : 'non';
  if (typeof v === 'number') return /montant|valeur/i.test(cle) ? `${montant(v)} FCFA` : String(v);
  if (Array.isArray(v)) return v.every((x) => typeof x !== 'object') ? v.join(', ') : `${v.length} élément${v.length > 1 ? 's' : ''}`;
  if (typeof v === 'object') return (v as { nom?: string }).nom ?? 'modifié';
  return String(v);
}

const ACTIONS: { valeur: ActionHistorique | 'tout'; libelle: string }[] = [
  { valeur: 'tout', libelle: 'Tout' },
  { valeur: 'creation', libelle: 'Créations' },
  { valeur: 'modification', libelle: 'Corrections' },
  { valeur: 'annulation', libelle: 'Annulations' },
  { valeur: 'parametres', libelle: 'Paramètres' },
];

const TITRES: Record<ActionHistorique, string> = {
  creation: 'Création',
  modification: 'Correction',
  annulation: 'Annulation',
  parametres: 'Paramètres modifiés',
};

export default function Historique() {
  const [entrees, setEntrees] = useState<EntreeHistorique[]>([]);
  const [limite, setLimite] = useState(100);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [filtre, setFiltre] = useState<ActionHistorique | 'tout'>('tout');

  useEffect(() => {
    return db
      .collection(nomCollection('historique'))
      .orderBy('date', 'desc')
      .limit(limite)
      .onSnapshot(
        (snap) => {
          setEntrees(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EntreeHistorique));
          setChargement(false);
        },
        () => {
          setErreur("L'historique n'a pas pu être chargé.");
          setChargement(false);
        },
      );
  }, [limite]);

  const visibles = entrees.filter((e) => filtre === 'tout' || e.action === filtre);

  return (
    <GabaritAdmin titre="Historique des modifications" sousTitre="Chaque création, correction ou annulation est conservée. Rien n'est effacé.">
      {erreur && <MessageErreur>{erreur}</MessageErreur>}
      <section className="carte">
        <div className="flex flex-wrap gap-2 border-b border-trait p-4 sm:px-6" role="group" aria-label="Filtrer">
          {ACTIONS.map((a) => (
            <button
              key={a.valeur}
              type="button"
              aria-pressed={filtre === a.valeur}
              onClick={() => setFiltre(a.valeur)}
              className={classes('min-h-[40px] rounded-full px-3.5 text-[13px]', filtre === a.valeur ? 'bg-encre font-bold text-white' : 'border border-[#D8DBD3] bg-white font-semibold')}
            >
              {a.libelle}
            </button>
          ))}
        </div>
        {chargement ? (
          <Chargement />
        ) : visibles.length === 0 ? (
          <p className="p-6 text-sm text-encre-pale">Aucune entrée.</p>
        ) : (
          <ol className="px-4 py-2 sm:px-6">
            {visibles.map((e, i) => {
              const champs = Object.keys(e.apres ?? {}).filter((k) => !CHAMPS_CACHES.has(k));
              return (
                <li key={e.id} className="flex gap-4 py-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={classes(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        e.action === 'creation' && 'bg-recu-pale text-recu',
                        e.action === 'modification' && 'bg-attente-pale text-attente',
                        e.action === 'annulation' && 'bg-depense-pale text-depense',
                        e.action === 'parametres' && 'bg-trait text-encre-douce',
                      )}
                    >
                      {e.action === 'creation' ? <span className="text-xl font-bold">+</span> : e.action === 'modification' ? <IconeCrayon taille={16} /> : e.action === 'annulation' ? <IconeAnnuler taille={16} /> : <IconeReglages taille={16} />}
                    </div>
                    {i < visibles.length - 1 && <div className="mt-1.5 w-0.5 flex-1 bg-trait" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div className="text-[15px] font-extrabold">{TITRES[e.action]} · {e.libelle}</div>
                      <div className="text-[13px] text-encre-pale">{dateHeure(e.date?.toMillis?.() ?? 0)} · {e.auteurEmail || 'administrateur'}</div>
                    </div>
                    {e.action === 'modification' || e.action === 'parametres' ? (
                      <div className="flex flex-col gap-1.5">
                        {champs.map((k) => (
                          <div key={k} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-encre-pale">{LIBELLES_CHAMPS[k] ?? k}</span>
                            <span className="rounded-lg bg-depense-pale px-2.5 py-0.5 font-bold text-depense-fonce line-through">{valeurLisible(k, e.avant?.[k])}</span>
                            <span aria-hidden="true">→</span>
                            <span className="sr-only">devient</span>
                            <span className="rounded-lg bg-recu-pale px-2.5 py-0.5 font-extrabold text-recu-fonce">{valeurLisible(k, e.apres?.[k])}</span>
                          </div>
                        ))}
                      </div>
                    ) : e.action === 'creation' && e.apres ? (
                      <div className="text-sm text-encre-douce">
                        {['montant', 'montantRecu', 'montantPaye', 'quantite', 'statut']
                          .filter((k) => e.apres && k in e.apres)
                          .map((k) => `${LIBELLES_CHAMPS[k]} : ${valeurLisible(k, e.apres![k])}`)
                          .join(' · ')}
                      </div>
                    ) : null}
                    {e.motif && <div className="rounded-[10px] bg-[#F7F8F5] px-3 py-2.5 text-[13px] text-encre-douce">Motif : {e.motif}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {entrees.length >= limite && (
          <div className="border-t border-trait p-4 text-center">
            <button type="button" onClick={() => setLimite(limite + 100)} className="min-h-[44px] rounded-xl border border-bord px-5 text-sm font-bold">
              Charger les entrées plus anciennes
            </button>
          </div>
        )}
      </section>
    </GabaritAdmin>
  );
}
