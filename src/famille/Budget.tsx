import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GabaritFamille } from './Gabarit';
import { EtatVide, Puce, classes } from '../composants/ui';
import { IconeRecherche } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import type { LigneBudget } from '../lib/calculs';
import { dateCourte, montant, pourRecherche } from '../lib/format';

type Filtre = 'tous' | 'engages' | 'non-chiffres' | 'depassements';

function Etat({ l }: { l: LigneBudget }) {
  if (l.prevision > 0 && l.engage > l.prevision) return <Puce ton="depense">Dépassement</Puce>;
  if (l.prevision === 0 && l.engage > 0) return <Puce ton="attente">Non prévu</Puce>;
  if (l.engage > 0 && l.resteAPayer === 0 && l.engage >= l.prevision) return <Puce ton="recu">Réglé</Puce>;
  if (l.engage > 0) return <Puce ton="attente">En cours</Puce>;
  if (l.prevision === 0) return <Puce ton="neutre">À chiffrer</Puce>;
  return <Puce ton="neutre">À venir</Puce>;
}

function Barre({ l }: { l: LigneBudget }) {
  const ref = Math.max(l.prevision, l.engage, 1);
  return (
    <div className="flex h-2 overflow-hidden rounded bg-trait">
      <div className="h-full bg-depense" style={{ width: `${(l.realise / ref) * 100}%` }} />
      <div className="h-full bg-attente-barre" style={{ width: `${(l.resteAPayer / ref) * 100}%` }} />
    </div>
  );
}

export default function Budget() {
  const { budget: b, depenses, devis, synthese: s } = useDonnees();
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [recherche, setRecherche] = useState('');

  const lignes = useMemo(() => {
    const q = pourRecherche(recherche);
    return b.lignes.filter(
      (l) =>
        (filtre === 'tous' ||
          (filtre === 'engages' && l.engage > 0) ||
          (filtre === 'non-chiffres' && l.prevision === 0) ||
          (filtre === 'depassements' && l.prevision > 0 && l.engage > l.prevision)) &&
        (!q || pourRecherche(`${l.poste.libelle} ${l.poste.responsable} ${l.poste.financement}`).includes(q)),
    );
  }, [b.lignes, filtre, recherche]);

  const pct = b.totalPrevision ? Math.min(100, Math.round((b.totalEngage / b.totalPrevision) * 100)) : 0;
  const besoin = b.totalPrevision - s.totalEncaisse;

  const FILTRES: { v: Filtre; l: string; n: number }[] = [
    { v: 'tous', l: 'Tous', n: b.lignes.length },
    { v: 'engages', l: 'Engagés', n: b.lignes.filter((l) => l.engage > 0).length },
    { v: 'non-chiffres', l: 'À chiffrer', n: b.nbPostesNonChiffres },
    { v: 'depassements', l: 'Dépassements', n: b.nbDepassements },
  ];

  return (
    <GabaritFamille titre="Budget" sousTitre="Les postes de dépenses prévus pour les obsèques, et ce qui a déjà été engagé et payé sur chacun.">
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-flottante">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
          {[
            { l: 'Budget prévu', v: b.totalPrevision, c: '' },
            { l: 'Engagé', v: b.totalEngage, c: 'text-attente' },
            { l: 'Payé', v: b.totalRealise, c: 'text-depense' },
            { l: besoin > 0 ? 'Reste à financer' : 'Excédent prévu', v: Math.abs(besoin), c: besoin > 0 ? 'text-depense-fonce' : 'text-recu' },
          ].map((k) => (
            <div key={k.l}>
              <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">{k.l}</div>
              <div className={classes('text-[28px] font-extrabold', k.c)}>
                {montant(k.v)} <span className="text-sm">FCFA</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex h-3 overflow-hidden rounded-lg bg-trait" role="img" aria-label={`${pct} % du budget engagé`}>
          <div className="bg-depense" style={{ width: `${b.totalPrevision ? Math.min(100, (b.totalRealise / b.totalPrevision) * 100) : 0}%` }} />
          <div className="bg-attente-barre" style={{ width: `${b.totalPrevision ? Math.min(100, ((b.totalEngage - b.totalRealise) / b.totalPrevision) * 100) : 0}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-encre-pale">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-depense" />Payé</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-attente-barre" />Engagé, reste à payer</span>
          <span>{pct} % du budget engagé</span>
          <span>« Reste à financer » = budget prévu − cotisations et participations reçues ({montant(s.totalEncaisse)} FCFA)</span>
        </div>
      </section>

      <section className="carte">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-trait p-4 sm:px-6">
          <div className="relative w-full max-w-[340px] flex-1">
            <IconeRecherche taille={18} className="absolute left-3.5 top-[13px] text-encre-pale" />
            <input
              type="search"
              aria-label="Rechercher un poste"
              placeholder="Rechercher un poste, un responsable…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="min-h-[44px] w-full rounded-full border border-[#D8DBD3] bg-[#F7F8F5] pl-11 pr-4 text-sm outline-none focus:border-recu"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les postes">
            {FILTRES.map((f) => (
              <button
                key={f.v}
                type="button"
                aria-pressed={filtre === f.v}
                onClick={() => setFiltre(f.v)}
                className={classes('min-h-[40px] rounded-full px-3.5 text-[13px]', filtre === f.v ? 'bg-encre font-bold text-white' : 'border border-[#D8DBD3] bg-white font-semibold')}
              >
                {f.l} · {f.n}
              </button>
            ))}
          </div>
        </div>

        {lignes.length === 0 ? (
          b.lignes.length === 0 ? (
            <div className="p-6"><EtatVide titre="Le budget n'est pas encore saisi" /></div>
          ) : (
            <p className="p-6 text-sm text-encre-pale">Aucun poste ne correspond.</p>
          )
        ) : (
          <ul>
            {lignes.map((l, i) => {
              const deps = depenses.filter((d) => !d.annule && d.posteId === l.poste.id);
              const nbDevis = devis.filter((v) => !v.annule && v.posteId === l.poste.id).length;
              return (
                <li key={l.poste.id} className={classes(i > 0 && 'border-t border-trait')}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                      <div className="flex min-w-[220px] flex-[3] flex-col gap-1.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-encre-pale transition group-open:rotate-90" aria-hidden="true">›</span>
                          <span className="font-bold">{l.poste.libelle}</span>
                        </div>
                        <div className="pl-4 text-xs text-encre-pale">
                          {[l.poste.responsable && `Responsable : ${l.poste.responsable}`, l.poste.financement && `Financement : ${l.poste.financement}`]
                            .filter(Boolean)
                            .join(' · ') || 'Responsable et financement à définir'}
                        </div>
                        <div className="pl-4"><Barre l={l} /></div>
                      </div>
                      <div className="grid flex-[2] grid-cols-3 gap-2 text-right text-sm" style={{ minWidth: 260 }}>
                        <div><div className="text-[11px] font-bold uppercase text-encre-pale">Prévu</div><div className="font-bold">{l.prevision ? montant(l.prevision) : '—'}</div></div>
                        <div><div className="text-[11px] font-bold uppercase text-encre-pale">Engagé</div><div className="font-bold text-attente">{l.engage ? montant(l.engage) : '—'}</div></div>
                        <div><div className="text-[11px] font-bold uppercase text-encre-pale">Payé</div><div className="font-extrabold text-depense">{l.realise ? montant(l.realise) : '—'}</div></div>
                      </div>
                      <div className="w-[104px] text-right"><Etat l={l} /></div>
                    </summary>
                    <div className="flex flex-col gap-2 bg-[#F7F8F5] px-4 py-4 text-sm sm:px-10">
                      {l.poste.commentaire && <p className="text-encre-douce">{l.poste.commentaire}</p>}
                      {l.prevision > 0 && (
                        <p className={classes('font-semibold', l.ecart < 0 ? 'text-depense-fonce' : 'text-encre-douce')}>
                          {l.ecart < 0 ? `Dépassement de ${montant(-l.ecart)} FCFA par rapport au prévu.` : `Marge restante : ${montant(l.ecart)} FCFA.`}
                        </p>
                      )}
                      {deps.length === 0 ? (
                        <p className="text-encre-pale">Aucune dépense enregistrée sur ce poste.</p>
                      ) : (
                        <ul className="flex flex-col gap-1.5">
                          {deps.map((d) => (
                            <li key={d.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white px-3 py-2">
                              <span>{d.designation} <span className="text-encre-pale">· {dateCourte(d.date)}{d.responsable ? ` · ${d.responsable}` : ''}</span></span>
                              <span className="font-bold text-depense">−{montant(d.montantPaye)}{d.montantPaye < d.montant && <span className="font-semibold text-attente"> / {montant(d.montant)}</span>}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {nbDevis > 0 && (
                        <Link to="/devis" className="font-bold text-recu">
                          {nbDevis} devis reçu{nbDevis > 1 ? 's' : ''} pour ce poste
                          {l.devisRetenu != null && ` · retenu : ${montant(l.devisRetenu)} FCFA`}
                        </Link>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        {b.horsBudget.nb > 0 && (
          <div className="flex flex-wrap justify-between gap-2 border-t border-trait px-4 py-3 text-sm sm:px-6">
            <span className="font-semibold">Dépenses hors budget ({b.horsBudget.nb})</span>
            <span className="font-bold text-depense">−{montant(b.horsBudget.realise)}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-encre px-4 py-4 sm:px-6">
          <span className="font-extrabold">Total</span>
          <span className="text-sm">
            Prévu <strong>{montant(b.totalPrevision)}</strong> · Engagé <strong className="text-attente">{montant(b.totalEngage)}</strong> · Payé{' '}
            <strong className="text-depense">{montant(b.totalRealise)}</strong> FCFA
          </span>
        </div>
      </section>
    </GabaritFamille>
  );
}
