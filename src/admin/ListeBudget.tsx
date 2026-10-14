import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { EtatVide, classes } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { montant, pourRecherche } from '../lib/format';

/** Administration du budget : liste des postes avec prévu, engagé, payé. */
export default function ListeBudget() {
  const { budget: b, parametres } = useDonnees();
  const [recherche, setRecherche] = useState('');
  const lignes = useMemo(() => {
    const q = pourRecherche(recherche);
    return b.lignes.filter((l) => !q || pourRecherche(`${l.poste.libelle} ${l.poste.responsable} ${l.poste.financement}`).includes(q));
  }, [b.lignes, recherche]);

  return (
    <GabaritAdmin
      titre="Budget"
      sousTitre="Postes de dépenses prévus. Le réalisé de chaque poste est calculé à partir des dépenses qui lui sont rattachées."
      actions={
        !parametres.cloture && (
          <Link to="/admin/poste/nouveau" className="inline-flex min-h-[46px] items-center rounded-xl bg-foret px-5 text-sm font-extrabold text-white no-underline">
            + Nouveau poste
          </Link>
        )
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        {[
          { l: 'Budget prévu', v: montant(b.totalPrevision), c: '' },
          { l: 'Engagé', v: montant(b.totalEngage), c: 'text-attente' },
          { l: 'Payé', v: montant(b.totalRealise), c: 'text-depense' },
          { l: 'Postes à chiffrer', v: String(b.nbPostesNonChiffres), c: '' },
          { l: 'Dépassements', v: String(b.nbDepassements), c: b.nbDepassements ? 'text-depense' : '' },
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
            aria-label="Rechercher un poste"
            placeholder="Rechercher un poste, un responsable, un financement…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="min-h-[42px] w-full max-w-[420px] rounded-full border border-[#D8DBD3] bg-[#F7F8F5] px-4 text-sm outline-none focus:border-recu"
          />
        </div>
        {b.lignes.length === 0 ? (
          <div className="p-6">
            <EtatVide titre="Aucun poste pour le moment">Ajoutez les postes un par un, ou importez le budget du fichier Excel depuis les Paramètres.</EtatVide>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.05em] text-encre-pale">
                  <th className="px-5 py-3 font-bold">Poste</th>
                  <th className="px-2.5 py-3 font-bold">Responsable</th>
                  <th className="px-2.5 py-3 font-bold">Financement</th>
                  <th className="px-2.5 py-3 text-right font-bold">Prévu</th>
                  <th className="px-2.5 py-3 text-right font-bold">Engagé</th>
                  <th className="px-2.5 py-3 text-right font-bold">Payé</th>
                  <th className="px-2.5 py-3 text-right font-bold">Écart</th>
                  <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.poste.id} className="border-t border-trait">
                    <td className="px-5 py-3 font-bold">{l.poste.libelle}{l.nbDepenses > 0 && <span className="ml-1.5 text-xs font-semibold text-encre-pale">({l.nbDepenses})</span>}</td>
                    <td className="px-2.5 py-3 text-encre-douce">{l.poste.responsable || '—'}</td>
                    <td className="px-2.5 py-3 text-encre-douce">{l.poste.financement || '—'}</td>
                    <td className="whitespace-nowrap px-2.5 py-3 text-right">{l.prevision ? montant(l.prevision) : <span className="text-encre-pale">à chiffrer</span>}</td>
                    <td className="whitespace-nowrap px-2.5 py-3 text-right text-attente">{l.engage ? montant(l.engage) : '—'}</td>
                    <td className="whitespace-nowrap px-2.5 py-3 text-right font-bold text-depense">{l.realise ? montant(l.realise) : '—'}</td>
                    <td className={classes('whitespace-nowrap px-2.5 py-3 text-right font-semibold', l.prevision && l.ecart < 0 ? 'text-depense-fonce' : 'text-encre-pale')}>
                      {l.prevision ? (l.ecart < 0 ? `−${montant(-l.ecart)}` : montant(l.ecart)) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/admin/poste/${l.poste.id}`} className="inline-flex min-h-[36px] items-center rounded-[10px] border border-[#D8DBD3] px-3 text-[13px] font-bold text-encre no-underline hover:bg-fond">
                        {parametres.cloture ? 'Voir' : 'Modifier'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-encre font-extrabold">
                  <td className="px-5 py-3" colSpan={3}>Total{b.horsBudget.nb > 0 && <span className="ml-2 text-xs font-semibold text-encre-pale">dont {b.horsBudget.nb} dépense(s) hors budget</span>}</td>
                  <td className="px-2.5 py-3 text-right">{montant(b.totalPrevision)}</td>
                  <td className="px-2.5 py-3 text-right text-attente">{montant(b.totalEngage)}</td>
                  <td className="px-2.5 py-3 text-right text-depense">{montant(b.totalRealise)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </GabaritAdmin>
  );
}
