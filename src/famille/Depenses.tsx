import { useMemo, useState } from 'react';
import { GabaritFamille } from './Gabarit';
import { EtatVide } from '../composants/ui';
import { IconeRecherche } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { dateCourte, montant, pourRecherche } from '../lib/format';
import type { Depense } from '../types';

const PAR_PAGE = 20;

export default function Depenses() {
  const { depenses, synthese: s } = useDonnees();
  const [numPage, setPage] = useState(0);
  const [recherche, setRecherche] = useState('');

  const payees = useMemo(() => {
    const q = pourRecherche(recherche);
    return depenses
      .filter(
        (d) =>
          !d.annule &&
          d.montantPaye > 0 &&
          (!q || pourRecherche(`${d.designation} ${d.responsable} ${d.financement} ${d.categorie}`).includes(q)),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [depenses, recherche]);

  const nbPages = Math.max(1, Math.ceil(payees.length / PAR_PAGE));
  const pageCourante = Math.min(numPage, nbPages - 1);
  const visibles = payees.slice(pageCourante * PAR_PAGE, (pageCourante + 1) * PAR_PAGE);

  return (
    <GabaritFamille
      titre="Dépenses"
      sousTitre="Ce qui a été payé, et ce qui reste à payer. Seules les sommes réellement versées sont retirées de la caisse."
    >
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-flottante">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Payé</div>
            <div className="text-[30px] font-extrabold text-depense">{montant(s.totalDepense)} <span className="text-sm">FCFA</span></div>
          </div>
        </div>
      </section>

      <section className="carte flex flex-col">
        <div className="border-b border-trait p-4">
          <div className="relative w-full max-w-[340px]">
            <IconeRecherche taille={18} className="absolute left-3.5 top-[13px] text-encre-pale" />
            <input
              type="search"
              aria-label="Rechercher une dépense"
              placeholder="Rechercher une dépense…"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(0);
              }}
              className="min-h-[44px] w-full rounded-full border border-[#D8DBD3] bg-[#F7F8F5] pl-11 pr-4 text-sm outline-none focus:border-recu"
            />
          </div>
        </div>

        {payees.length === 0 ? (
          <div className="p-6">
            <EtatVide titre={recherche ? 'Aucune dépense ne correspond à votre recherche' : 'Aucune dépense payée pour le moment'} />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-trait text-left text-xs uppercase tracking-[0.05em] text-encre-pale">
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-2.5 py-3 font-bold">Désignation</th>
                    <th className="px-2.5 py-3 font-bold">Responsable / Financement</th>
                    <th className="px-2.5 py-3 text-right font-bold">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((d, i) => (
                    <tr key={d.id} className={i > 0 ? 'border-t border-trait' : ''}>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-encre-douce">{dateCourte(d.date)}</td>
                      <td className="px-2.5 py-3.5">
                        <div className="font-bold text-sm">{d.designation}</div>
                        <div className="text-xs text-encre-pale">{d.categorie}</div>
                      </td>
                      <td className="px-2.5 py-3.5 text-sm">
                        <div className="text-encre-douce">
                          {[d.responsable && `Resp. : ${d.responsable}`, d.financement && `Fin. : ${d.financement}`].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-extrabold text-depense">{montant(d.montantPaye)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-trait px-5 py-3 text-[13px] text-encre-pale">
              <span>{payees.length} dépense{payees.length > 1 ? 's' : ''}</span>
              {nbPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageCourante === 0}
                    onClick={() => setPage(pageCourante - 1)}
                    className="min-h-[36px] rounded-lg border border-bord px-3 font-bold disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <span>
                    Page {pageCourante + 1} / {nbPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageCourante >= nbPages - 1}
                    onClick={() => setPage(pageCourante + 1)}
                    className="min-h-[36px] rounded-lg border border-bord px-3 font-bold disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-encre px-5 py-4">
          <span className="font-extrabold">Total dépenses payées</span>
          <span className="text-sm">
            <strong className="text-depense">{montant(s.totalDepense)}</strong> FCFA
          </span>
        </div>
      </section>
    </GabaritFamille>
  );
}
