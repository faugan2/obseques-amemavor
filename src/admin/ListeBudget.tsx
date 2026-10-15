import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { EtatVide, Chargement, classes, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer, modifier } from '../lib/operations';
import { montant, pourRecherche } from '../lib/format';
import initiales from '../lib/donneesInitiales.json';

/** Administration du budget : lignes de budget par libellé. */
export default function ListeBudget() {
  const { budgetLignes, libelles, parametres, budget: budgetStats } = useDonnees();
  const [recherche, setRecherche] = useState('');
  const [syncEnCours, setSyncEnCours] = useState(false);
  const notifier = useNotifier();

  // Synchroniser: créer les lignes de budget manquantes
  const synchroniser = async () => {
    setSyncEnCours(true);
    try {
      let creees = 0;
      for (const lib of libelles) {
        const existe = budgetLignes.some((bl) => bl.id_libelle === lib.id);
        if (!existe) {
          const budgetData = {
            id_libelle: lib.id,
            responsable: '',
            financement: '',
            prevision: 0,
            montantPaye: 0,
            commentaire: `Créé automatiquement pour le libellé "${lib.nom}"`,
          };
          await creer('budget', budgetData, `Budget · ${lib.nom}`);
          creees++;
        }
      }
      notifier(`✅ ${creees} ligne${creees > 1 ? 's' : ''} de budget créée${creees > 1 ? 's' : ''}`);
    } catch (e) {
      notifier(`❌ Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setSyncEnCours(false);
    }
  };

  // Importer les montants du fichier Excel
  const importerMontants = async () => {
    setSyncEnCours(true);
    try {
      let mises_a_jour = 0;
      for (const poste of (initiales as any).postes) {
        // Chercher le libellé correspondant
        const lib = libelles.find((l) => {
          const nomNorm = (n: string) => n.toUpperCase().trim();
          return nomNorm(l.nom) === nomNorm(poste.libelle);
        });

        if (lib) {
          // Trouver la ligne de budget
          const bl = budgetLignes.find((bl) => bl.id_libelle === lib.id);
          if (bl) {
            // Mettre à jour avec les montants du fichier
            const avant = { ...bl };
            const apres = {
              ...bl,
              prevision: poste.prevision || 0,
              financement: poste.financement || '',
              responsable: poste.responsable || '',
            };
            await modifier('budget', bl.id, avant as unknown as Record<string, unknown>, apres, `Budget · ${lib.nom}`, 'Import des montants depuis Excel');
            mises_a_jour++;
          }
        }
      }
      notifier(`✅ ${mises_a_jour} ligne${mises_a_jour > 1 ? 's' : ''} mise${mises_a_jour > 1 ? 's' : ''} à jour`);
    } catch (e) {
      notifier(`❌ Erreur: ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setSyncEnCours(false);
    }
  };

  // Joindre les lignes de budget avec les libellés
  const lignes = useMemo(() => {
    const q = pourRecherche(recherche);
    return budgetLignes
      .map((bl) => {
        const lib = libelles.find((l) => l.id === bl.id_libelle);
        return { ...bl, libelle: lib };
      })
      .filter((l) => {
        if (!q) return true;
        const nom = l.libelle?.nom || '';
        const resp = l.responsable || '';
        const fin = l.financement || '';
        return pourRecherche(`${nom} ${resp} ${fin}`).includes(q);
      })
      .sort((a, b) => (a.libelle?.ordre || 0) - (b.libelle?.ordre || 0));
  }, [budgetLignes, libelles, recherche]);

  const manquantes = libelles.filter((lib) => !budgetLignes.some((bl) => bl.id_libelle === lib.id)).length;
  const sansMotants = budgetLignes.filter((bl) => bl.prevision === 0).length;

  return (
    <GabaritAdmin
      titre="Budget"
      sousTitre="Montants prévisionnels et réalisés par libellé."
      actions={
        <div className="flex gap-3">
          {sansMotants > 0 && (
            <button
              onClick={() => void importerMontants()}
              disabled={syncEnCours}
              className="inline-flex min-h-[46px] items-center rounded-xl bg-recu px-5 text-sm font-extrabold text-white no-underline hover:opacity-90 disabled:opacity-50"
            >
              {syncEnCours ? <Chargement /> : `Importer montants`}
            </button>
          )}
          {manquantes > 0 && (
            <button
              onClick={() => void synchroniser()}
              disabled={syncEnCours}
              className="inline-flex min-h-[46px] items-center rounded-xl bg-attente px-5 text-sm font-extrabold text-white no-underline hover:opacity-90 disabled:opacity-50"
            >
              {syncEnCours ? <Chargement /> : `Créer ${manquantes} ligne${manquantes > 1 ? 's' : ''}`}
            </button>
          )}
          {!parametres.cloture && (
            <Link to="/admin/libelles" className="inline-flex min-h-[46px] items-center rounded-xl bg-foret px-5 text-sm font-extrabold text-white no-underline">
              + Nouveau libellé
            </Link>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        {[
          { l: 'Budget total prévu', v: montant(budgetStats.totalPrevision), c: '' },
          { l: 'Engagé', v: montant(budgetStats.totalEngage), c: 'text-attente' },
          { l: 'Payé', v: montant(budgetStats.totalRealise), c: 'text-depense' },
          { l: 'Reste à dépenser', v: montant(budgetStats.reste), c: 'text-recu' },
        ].map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-[18px] bg-white p-[18px] shadow-carte">
            <div className="text-xs font-bold text-encre-pale">{k.l}</div>
            <div className={classes('text-[24px] font-extrabold', k.c)}>{k.v}</div>
          </div>
        ))}
      </div>

      <section className="carte">
        <div className="border-b border-trait p-4 sm:px-5">
          <input
            type="search"
            aria-label="Rechercher un libellé"
            placeholder="Rechercher un libellé, un responsable, un financement…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="min-h-[42px] w-full max-w-[420px] rounded-full border border-[#D8DBD3] bg-[#F7F8F5] px-4 text-sm outline-none focus:border-recu"
          />
        </div>
        {budgetLignes.length === 0 ? (
          <div className="p-6">
            <EtatVide titre="Aucune ligne de budget pour le moment">
              Créez des libellés dans Admin → Libellés. Chaque libellé créé génère automatiquement une ligne de budget.
            </EtatVide>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.05em] text-encre-pale">
                  <th className="px-5 py-3 font-bold">Libellé</th>
                  <th className="px-2.5 py-3 font-bold">Responsable</th>
                  <th className="px-2.5 py-3 font-bold">Financement</th>
                  <th className="px-2.5 py-3 text-right font-bold">Prévu</th>
                  <th className="px-2.5 py-3 text-right font-bold">Payé</th>
                  <th className="px-2.5 py-3 text-right font-bold">Reste</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => {
                  const reste = (l.prevision || 0) - (l.montantPaye || 0);
                  return (
                    <tr key={l.id} className={i > 0 ? 'border-t border-trait' : ''}>
                      <td className="px-5 py-3 font-bold">{l.libelle?.nom || '—'}</td>
                      <td className="px-2.5 py-3 text-encre-douce">{l.responsable || '—'}</td>
                      <td className="px-2.5 py-3 text-encre-douce">{l.financement || '—'}</td>
                      <td className="whitespace-nowrap px-2.5 py-3 text-right">
                        {l.prevision ? montant(l.prevision) : <span className="text-encre-pale">à chiffrer</span>}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-3 text-right font-bold text-depense">
                        {l.montantPaye ? montant(l.montantPaye) : '—'}
                      </td>
                      <td className={classes('whitespace-nowrap px-2.5 py-3 text-right font-semibold', reste < 0 ? 'text-depense-fonce' : 'text-recu')}>
                        {l.prevision ? montant(Math.max(0, reste)) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/admin/budget/${l.id}`}
                          className="inline-flex min-h-[36px] items-center rounded-[10px] border border-[#D8DBD3] px-3 text-[13px] font-bold text-encre no-underline hover:bg-fond"
                        >
                          {parametres.cloture ? 'Voir' : 'Modifier'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-encre font-extrabold">
                  <td className="px-5 py-3" colSpan={3}>Total</td>
                  <td className="px-2.5 py-3 text-right">{montant(budgetStats.totalPrevision)}</td>
                  <td className="px-2.5 py-3 text-right text-depense">{montant(budgetStats.totalRealise)}</td>
                  <td className="px-2.5 py-3 text-right text-recu">{montant(budgetStats.reste)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </GabaritAdmin>
  );
}
