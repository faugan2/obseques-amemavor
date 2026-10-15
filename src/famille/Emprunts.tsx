import { useMemo, useState } from 'react';
import { GabaritFamille } from './Gabarit';
import { EtatVide, Puce, classes } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { montant, dateCourte } from '../lib/format';

const PAR_PAGE = 20;

function EtatEmprunt({ e }: { e: any }) {
  const solde = e.montant - e.montantRembourse;
  if (e.annule) return <Puce ton="annule">Annulé</Puce>;
  if (solde <= 0) return <Puce ton="recu">Remboursé</Puce>;
  if (e.montantRembourse > 0) return <Puce ton="attente">Partiellement remboursé</Puce>;
  return <Puce ton="neutre">En cours</Puce>;
}

export default function Emprunts() {
  const { emprunts } = useDonnees();
  const [numPage, setPage] = useState(0);

  const actifs = useMemo(() => {
    return emprunts
      .filter((e) => !e.annule)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [emprunts]);

  const totalEmprunts = emprunts.reduce((s: number, e: any) => !e.annule ? s + e.montant : s, 0);
  const totalRestant = emprunts.reduce((s: number, e: any) => !e.annule ? s + Math.max(0, e.montant - e.montantRembourse) : s, 0);

  const nbPages = Math.max(1, Math.ceil(actifs.length / PAR_PAGE));
  const pageCourante = Math.min(numPage, nbPages - 1);
  const visibles = actifs.slice(pageCourante * PAR_PAGE, (pageCourante + 1) * PAR_PAGE);

  return (
    <GabaritFamille
      titre="Emprunts"
      sousTitre="Prêts accordés à la famille pour financer les obsèques."
    >
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-flottante">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Total emprunté</div>
            <div className="text-[28px] font-extrabold text-encre">
              {montant(totalEmprunts)} <span className="text-sm">FCFA</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Solde à rembourser</div>
            <div className={classes('text-[28px] font-extrabold', totalRestant > 0 ? 'text-attente' : 'text-recu')}>
              {montant(totalRestant)} <span className="text-sm">FCFA</span>
            </div>
          </div>
        </div>
      </section>

      <section className="carte flex flex-col">
        {actifs.length === 0 ? (
          <div className="p-6">
            <EtatVide titre="Aucun emprunt enregistré" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-trait text-left text-xs uppercase tracking-[0.05em] text-encre-pale">
                    <th className="px-5 py-3 font-bold">Date</th>
                    <th className="px-2.5 py-3 font-bold">Prêteur</th>
                    <th className="px-2.5 py-3 text-right font-bold">Montant</th>
                    <th className="px-2.5 py-3 text-right font-bold">Remboursé</th>
                    <th className="px-2.5 py-3 text-right font-bold">Solde</th>
                    <th className="px-2.5 py-3 text-center font-bold">État</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((e, i) => {
                    const solde = e.montant - e.montantRembourse;
                    return (
                      <tr key={e.id} className={i > 0 ? 'border-t border-trait' : ''}>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-encre-douce">{dateCourte(e.date)}</td>
                        <td className="px-2.5 py-3.5">
                          <div className="font-bold text-sm">{e.preteur}</div>
                          {e.commentaire && <div className="text-xs text-encre-pale">{e.commentaire}</div>}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-bold">{montant(e.montant)}</td>
                        <td className="whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-bold text-recu">{montant(e.montantRembourse)}</td>
                        <td className={classes('whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-extrabold', solde > 0 ? 'text-attente' : 'text-recu')}>
                          {montant(solde)}
                        </td>
                        <td className="px-2.5 py-3.5 text-center"><EtatEmprunt e={e} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-trait px-5 py-3 text-[13px] text-encre-pale">
              <span>{actifs.length} emprunt{actifs.length > 1 ? 's' : ''}</span>
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
          <span className="font-extrabold">Total solde restant</span>
          <span className="text-sm">
            <strong className={totalRestant > 0 ? 'text-attente' : 'text-recu'}>{montant(totalRestant)}</strong> FCFA
          </span>
        </div>
      </section>
    </GabaritFamille>
  );
}
