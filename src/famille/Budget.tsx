import { useMemo, useState } from 'react';
import { GabaritFamille } from './Gabarit';
import { EtatVide, Puce, classes } from '../composants/ui';
import { IconeRecherche, IconeCroix } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import type { LigneBudget } from '../lib/calculs';
import type { Depense, Contribution, Emprunt } from '../types';
import { montant, pourRecherche, dateLongue } from '../lib/format';

type Filtre = 'tous' | 'engages' | 'non-chiffres' | 'depassements';
const PAR_PAGE = 20;

function Etat({ l }: { l: LigneBudget }) {
  if (l.prevision > 0 && l.engage > l.prevision) return <Puce ton="depense">Dépassement</Puce>;
  if (l.prevision === 0 && l.engage > 0) return <Puce ton="attente">Non prévu</Puce>;
  if (l.engage > 0 && l.resteAPayer === 0 && l.engage >= l.prevision) return <Puce ton="recu">Réglé</Puce>;
  if (l.engage > 0) return <Puce ton="attente">En cours</Puce>;
  if (l.prevision === 0) return <Puce ton="neutre">À chiffrer</Puce>;
  return <Puce ton="neutre">À venir</Puce>;
}

function ModalCaisse({ contributions, emprunts = [], onClose }: { contributions: Contribution[]; emprunts?: Emprunt[]; onClose: () => void }) {
  const cotisations = contributions.filter((c) => c.type === 'cotisation' && !c.annule);
  const participations = contributions.filter((c) => c.type === 'participation' && !c.annule);
  const empruntsActifs = emprunts.filter((e) => !e.annule);

  const totalCotisations = cotisations.reduce((sum, c) => sum + c.montantRecu, 0);
  const totalParticipations = participations.reduce((sum, c) => sum + c.montantRecu, 0);
  const totalEmprunts = empruntsActifs.reduce((sum, e) => sum + e.montant, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titre text-xl font-normal">Caisse reçue</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-fond">
            <IconeCroix taille={24} />
          </button>
        </div>

        <div className="space-y-4">
          {cotisations.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Cotisations ({cotisations.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {cotisations.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm bg-[#F7F8F5] p-2 rounded">
                    <span>{c.contributeur}</span>
                    <span className="font-bold text-recu">{montant(c.montantRecu)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold border-t border-trait pt-2">
                <span>Sous-total cotisations</span>
                <span className="text-recu">{montant(totalCotisations)}</span>
              </div>
            </div>
          )}

          {participations.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Participations ({participations.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {participations.map((c) => (
                  <div key={c.id} className="flex justify-between text-sm bg-[#F7F8F5] p-2 rounded">
                    <span>{c.contributeur}</span>
                    <span className="font-bold text-recu">{montant(c.montantRecu)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold border-t border-trait pt-2">
                <span>Sous-total participations</span>
                <span className="text-recu">{montant(totalParticipations)}</span>
              </div>
            </div>
          )}

          {empruntsActifs.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Emprunts ({empruntsActifs.length})</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {empruntsActifs.map((e) => (
                  <div key={e.id} className="flex justify-between text-sm bg-[#F7F8F5] p-2 rounded">
                    <span>{e.prêteur}</span>
                    <span className="font-bold text-recu">{montant(e.montant)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold border-t border-trait pt-2">
                <span>Sous-total emprunts</span>
                <span className="text-recu">{montant(totalEmprunts)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t-2 border-encre pt-3 flex justify-between text-sm font-extrabold">
          <span>Total caisse:</span>
          <span className="text-recu">{montant(totalCotisations + totalParticipations + totalEmprunts)}</span>
        </div>
      </div>
    </div>
  );
}

function ModalBudget({ lignes, onClose }: { lignes: LigneBudget[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titre text-xl font-normal">Budget prévu</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-fond">
            <IconeCroix taille={24} />
          </button>
        </div>

        <div className="space-y-1 max-h-96 overflow-y-auto">
          {lignes.map((l) => (
            <div key={l.poste.id} className="flex justify-between text-sm bg-[#F7F8F5] p-2 rounded">
              <span className="flex-1">{l.poste.libelle}</span>
              <span className="font-bold">{montant(l.prevision)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t-2 border-encre pt-3 flex justify-between text-sm font-extrabold">
          <span>Total budget:</span>
          <span>{montant(lignes.reduce((sum, l) => sum + l.prevision, 0))}</span>
        </div>
      </div>
    </div>
  );
}

function ModalDepensesPaye({ depenses, onClose }: { depenses: Depense[]; onClose: () => void }) {
  const payees = depenses.filter((d) => !d.annule && d.montantPaye > 0);
  const totalPaye = payees.reduce((sum, d) => sum + d.montantPaye, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titre text-xl font-normal">Montants payés ({payees.length})</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-fond">
            <IconeCroix taille={24} />
          </button>
        </div>

        {payees.length === 0 ? (
          <p className="text-sm text-encre-pale">Aucune dépense payée.</p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {payees.map((d) => (
              <div key={d.id} className="flex flex-wrap justify-between gap-2 text-sm bg-[#F7F8F5] p-2 rounded">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{d.designation}</div>
                  <div className="text-xs text-encre-pale">
                    {dateLongue(d.date)}
                    {d.responsable && ` · ${d.responsable}`}
                  </div>
                </div>
                <span className="font-bold text-depense">{montant(d.montantPaye)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t-2 border-encre pt-3 flex justify-between text-sm font-extrabold">
          <span>Total payé:</span>
          <span className="text-depense">{montant(totalPaye)}</span>
        </div>
      </div>
    </div>
  );
}

function ModalHistorique({ libelle, id_libelle, depenses, onClose }: { libelle: string; id_libelle: string; depenses: Depense[]; onClose: () => void }) {
  const liees = depenses.filter((d) => !d.annule && (d.id_libelle === id_libelle || d.categorie === libelle));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-titre text-xl font-normal">{libelle}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-fond">
            <IconeCroix taille={24} />
          </button>
        </div>

        {liees.length === 0 ? (
          <p className="text-sm text-encre-pale">Aucune dépense pour ce libellé.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {liees.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F7F8F5] p-3 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{d.designation}</div>
                  <div className="text-xs text-encre-pale">
                    {dateLongue(d.date)}
                    {d.responsable && ` · ${d.responsable}`}
                    {d.financement && ` · ${d.financement}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-depense">{montant(d.montantPaye)}</div>
                  {d.montantPaye < d.montant && <div className="text-xs text-encre-pale">/ {montant(d.montant)}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-trait pt-3 flex justify-between text-sm font-semibold">
          <span>Total:</span>
          <span className="text-depense">{montant(liees.reduce((sum, d) => sum + d.montantPaye, 0))}</span>
        </div>
      </div>
    </div>
  );
}

export default function Budget() {
  const { budget: b, depenses, contributions, emprunts, synthese: s } = useDonnees();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [recherche, setRecherche] = useState('');
  const [numPage, setPage] = useState(0);
  const [libelleSelectionnee, setLibelleSelectionnee] = useState<{ id: string; nom: string } | null>(null);
  const [modalOuvert, setModalOuvert] = useState<'caisse' | 'budget' | 'depenses' | null>(null);

  const lignes = useMemo(() => {
    const q = pourRecherche(recherche);
    return b.lignes
      .filter(
        (l) =>
          (filtre === 'tous' ||
            (filtre === 'engages' && l.engage > 0) ||
            (filtre === 'non-chiffres' && l.prevision === 0) ||
            (filtre === 'depassements' && l.prevision > 0 && l.engage > l.prevision)) &&
          (!q || pourRecherche(`${l.poste.libelle} ${l.poste.responsable} ${l.poste.financement}`).includes(q)),
      )
      .sort((a, b) => b.prevision - a.prevision); // Tri décroissant par montant prévu
  }, [b.lignes, filtre, recherche]);

  const pct = b.totalPrevision ? Math.min(100, Math.round((b.totalEngage / b.totalPrevision) * 100)) : 0;
  const besoin = b.totalPrevision - s.totalEncaisse;

  const FILTRES: { v: Filtre; l: string; n: number }[] = [
    { v: 'tous', l: 'Tous', n: b.lignes.length },
    { v: 'engages', l: 'Engagés', n: b.lignes.filter((l) => l.engage > 0).length },
    { v: 'non-chiffres', l: 'À chiffrer', n: b.nbPostesNonChiffres },
    { v: 'depassements', l: 'Dépassements', n: b.nbDepassements },
  ];

  const nbPages = Math.max(1, Math.ceil(lignes.length / PAR_PAGE));
  const pageCourante = Math.min(numPage, nbPages - 1);
  const visibles = lignes.slice(pageCourante * PAR_PAGE, (pageCourante + 1) * PAR_PAGE);

  return (
    <GabaritFamille titre="Budget" sousTitre="Les postes de dépenses prévus pour les obsèques, et ce qui a déjà été engagé et payé sur chacun.">
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-flottante">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          <div className="cursor-pointer rounded-lg p-3 hover:bg-fond transition" onClick={() => setModalOuvert('caisse')}>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Caisse reçue</div>
            <div className={classes('text-[28px] font-extrabold text-recu')}>
              {montant(s.totalEncaisse)} <span className="text-sm">FCFA</span>
            </div>
            <div className="text-xs text-encre-pale">Cotisations + Participations + Emprunts</div>
          </div>

          <div className="cursor-pointer rounded-lg p-3 hover:bg-fond transition" onClick={() => setModalOuvert('budget')}>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Budget prévu</div>
            <div className="text-[28px] font-extrabold">
              {montant(b.totalPrevision)} <span className="text-sm">FCFA</span>
            </div>
            <div className="text-xs text-encre-pale">Total prévisionnel</div>
          </div>

          <div className="cursor-pointer rounded-lg p-3 hover:bg-fond transition" onClick={() => setModalOuvert('depenses')}>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Montant payé</div>
            <div className="text-[28px] font-extrabold text-depense">
              {montant(b.totalRealise)} <span className="text-sm">FCFA</span>
            </div>
            <div className="text-xs text-encre-pale">Dépenses réglées</div>
          </div>

          <div className="cursor-pointer rounded-lg p-3 hover:bg-fond transition" onClick={() => {}}>
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">{s.solde >= 0 ? 'Solde caisse' : 'Déficit'}</div>
            <div className={classes('text-[28px] font-extrabold', s.solde >= 0 ? 'text-recu' : 'text-depense-fonce')}>
              {montant(Math.abs(s.solde))} <span className="text-sm">FCFA</span>
            </div>
            <div className="text-xs text-encre-pale">{s.solde >= 0 ? 'Caisse − Payé' : 'Payé − Caisse'}</div>
          </div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-lg bg-trait" role="img" aria-label={`${pct} % du budget engagé`}>
          <div className="bg-depense" style={{ width: `${b.totalPrevision ? Math.min(100, (b.totalRealise / b.totalPrevision) * 100) : 0}%` }} />
          <div className="bg-attente-barre" style={{ width: `${b.totalPrevision ? Math.min(100, ((b.totalEngage - b.totalRealise) / b.totalPrevision) * 100) : 0}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-encre-pale">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-depense" />Dépenses payées</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-attente-barre" />Dépenses engagées, non payées</span>
          <span>{pct} % du budget engagé</span>
        </div>
      </section>

      <section className="carte flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-trait p-4 sm:px-6">
          <div className="relative w-full max-w-[340px] flex-1">
            <IconeRecherche taille={18} className="absolute left-3.5 top-[13px] text-encre-pale" />
            <input
              type="search"
              aria-label="Rechercher un poste"
              placeholder="Rechercher un poste, un responsable…"
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setPage(0);
              }}
              className="min-h-[44px] w-full rounded-full border border-[#D8DBD3] bg-[#F7F8F5] pl-11 pr-4 text-sm outline-none focus:border-recu"
            />
          </div>
        </div>

        {lignes.length === 0 ? (
          b.lignes.length === 0 ? (
            <div className="p-6"><EtatVide titre="Le budget n'est pas encore saisi" /></div>
          ) : (
            <p className="p-6 text-sm text-encre-pale">Aucun poste ne correspond.</p>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-trait text-left text-xs uppercase tracking-[0.05em] text-encre-pale">
                    <th className="px-5 py-3 font-bold">Libellé</th>
                    <th className="px-2.5 py-3 text-right font-bold">Prévu</th>
                    <th className="px-2.5 py-3 text-right font-bold">Payé</th>
                    <th className="px-2.5 py-3 text-center font-bold">État</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((l, i) => (
                    <tr key={l.poste.id} className={classes(i > 0 ? 'border-t border-trait' : '', 'cursor-pointer hover:bg-[#F7F8F5]')} onClick={() => setLibelleSelectionnee({ id: l.poste.id, nom: l.poste.libelle })}>
                      <td className="px-5 py-3.5">
                        <div className="font-bold">{l.poste.libelle}</div>
                        <div className="text-xs text-encre-pale">
                          {[l.poste.responsable && `Resp. : ${l.poste.responsable}`, l.poste.financement && `Fin. : ${l.poste.financement}`]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-bold">{l.prevision ? montant(l.prevision) : '—'}</td>
                      <td className="whitespace-nowrap px-2.5 py-3.5 text-right text-sm font-extrabold text-depense">{l.realise ? montant(l.realise) : '—'}</td>
                      <td className="px-2.5 py-3.5 text-center"><Etat l={l} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-trait px-5 py-3 text-[13px] text-encre-pale">
              <span>{lignes.length} poste{lignes.length > 1 ? 's' : ''}</span>
              {nbPages > 1 && (
                <div className="flex items-center gap-2">
                  <button type="button" disabled={pageCourante === 0} onClick={() => setPage(pageCourante - 1)} className="min-h-[36px] rounded-lg border border-bord px-3 font-bold disabled:opacity-40">
                    Précédent
                  </button>
                  <span>
                    Page {pageCourante + 1} / {nbPages}
                  </span>
                  <button type="button" disabled={pageCourante >= nbPages - 1} onClick={() => setPage(pageCourante + 1)} className="min-h-[36px] rounded-lg border border-bord px-3 font-bold disabled:opacity-40">
                    Suivant
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {b.horsBudget.nb > 0 && (
          <div className="flex flex-wrap justify-between gap-2 border-t border-trait px-5 py-3 text-sm sm:px-6">
            <span className="font-semibold">Dépenses hors budget ({b.horsBudget.nb})</span>
            <span className="font-bold text-depense">{montant(b.horsBudget.realise)}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-encre px-5 py-4 sm:px-6">
          <span className="font-extrabold">Total</span>
          <span className="text-sm">
            Prévu <strong>{montant(b.totalPrevision)}</strong> · Payé <strong className="text-depense">{montant(b.totalRealise)}</strong> FCFA
          </span>
        </div>
      </section>

      {libelleSelectionnee && (
        <ModalHistorique
          libelle={libelleSelectionnee.nom}
          id_libelle={libelleSelectionnee.id}
          depenses={depenses}
          onClose={() => setLibelleSelectionnee(null)}
        />
      )}

      {modalOuvert === 'caisse' && (
        <ModalCaisse
          contributions={contributions}
          emprunts={emprunts}
          onClose={() => setModalOuvert(null)}
        />
      )}

      {modalOuvert === 'budget' && (
        <ModalBudget
          lignes={b.lignes}
          onClose={() => setModalOuvert(null)}
        />
      )}

      {modalOuvert === 'depenses' && (
        <ModalDepensesPaye
          depenses={depenses}
          onClose={() => setModalOuvert(null)}
        />
      )}
    </GabaritFamille>
  );
}
