import { useState } from 'react';
import { GabaritFamille } from './Gabarit';
import { EtatVide, Puce, classes } from '../composants/ui';
import { IconeCategorie, IconeDocument, IconeHorloge } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { lienJustificatif } from '../lib/operations';
import { dateLongue, libelleMode, montant } from '../lib/format';
import type { Depense } from '../types';

function BoutonJustificatif({ depense }: { depense: Depense }) {
  const [erreur, setErreur] = useState(false);
  if (!depense.justificatif) return null;
  const ouvrir = async () => {
    try {
      window.open(await lienJustificatif(depense.justificatif!), '_blank', 'noopener');
    } catch {
      setErreur(true);
    }
  };
  return (
    <button type="button" onClick={ouvrir} className="flex min-h-[40px] items-center gap-1.5 rounded-[10px] bg-fond px-3 text-[13px] font-bold text-recu">
      <IconeDocument taille={16} />
      {erreur ? 'Indisponible' : 'Reçu'}
    </button>
  );
}

function Carte({ d, montrerJustif }: { d: Depense; montrerJustif: boolean }) {
  const attente = d.statut !== 'payee';
  return (
    <article
      className={classes(
        'flex flex-wrap items-center gap-4 rounded-[18px] bg-white px-5 py-4 sm:px-6',
        attente ? 'border border-[#EED9A4]' : 'shadow-carte',
        d.annule && 'opacity-60',
      )}
    >
      <div className={classes('flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]', attente ? 'bg-attente-pale text-attente' : 'bg-depense-pale text-depense')}>
        {d.statut === 'prevue' ? <IconeHorloge taille={22} /> : <IconeCategorie categorie={d.categorie} taille={22} />}
      </div>
      <div className="flex min-w-[220px] flex-1 flex-col gap-0.5">
        <div className={classes('text-base font-bold', d.annule && 'line-through')}>{d.designation}</div>
        <div className="text-[13px] text-encre-pale">
          {[d.categorie, dateLongue(d.date), d.responsable && `par ${d.responsable}`, d.financement && `financé par ${d.financement}`, d.beneficiaire, libelleMode(d.mode)].filter(Boolean).join(' · ')}
        </div>
        {d.annule && d.motifAnnulation && <div className="text-xs text-encre-pale">Annulée : {d.motifAnnulation}</div>}
      </div>
      {montrerJustif && <BoutonJustificatif depense={d} />}
      {d.annule && <Puce ton="annule">Annulée</Puce>}
      <div className={classes('min-w-[96px] text-right text-lg font-extrabold', attente ? 'text-attente' : 'text-depense')}>
        {d.statut === 'payee' ? montant(d.montantPaye) : montant(d.montant - d.montantPaye)}
      </div>
    </article>
  );
}

export default function Depenses() {
  const { depenses, synthese: s, parametres } = useDonnees();
  const payees = depenses.filter((d) => d.montantPaye > 0 && (d.statut === 'payee' || d.annule));
  const aPayer = depenses.filter((d) => !d.annule && d.statut !== 'payee');
  const engage = s.totalDepense + s.resteAPayer;
  const pctPaye = engage ? Math.round((s.totalDepense / engage) * 100) : 0;
  const parSource = new Map<string, number>();
  for (const d of depenses) {
    if (d.annule || d.montantPaye <= 0) continue;
    const cle = d.financement || 'Caisse des obsèques';
    parSource.set(cle, (parSource.get(cle) ?? 0) + d.montantPaye);
  }
  const sources = [...parSource.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <GabaritFamille
      titre="Dépenses"
      sousTitre="Ce qui a été payé, et ce qui reste à payer. Seules les sommes réellement versées sont retirées de la caisse."
    >
      <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-flottante">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
          <div><div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Payé</div><div className="text-[30px] font-extrabold text-depense">{montant(s.totalDepense)} <span className="text-sm">FCFA</span></div></div>
          <div><div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Reste à payer</div><div className="text-[30px] font-extrabold text-attente">{montant(s.resteAPayer)} <span className="text-sm">FCFA</span></div></div>
        </div>
        <div className="flex h-3.5 overflow-hidden rounded-lg bg-trait" role="img" aria-label={`${pctPaye} % payé, ${100 - pctPaye} % reste à payer`}>
          <div className="bg-depense" style={{ width: `${pctPaye}%` }} />
          <div className="bg-attente-barre" style={{ width: `${engage ? 100 - pctPaye : 0}%` }} />
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-encre-pale">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-depense" />Payé · {pctPaye} %</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-attente-barre" />Reste à payer · {engage ? 100 - pctPaye : 0} %</span>
        </div>
      </section>

      {sources.length > 0 && (
        <section className="carte flex flex-col gap-3 p-5 sm:px-6">
          <h2 className="font-titre text-[22px] font-normal">Par source de financement</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {sources.map(([source, total]) => (
              <div key={source} className="flex flex-col rounded-xl bg-[#F7F8F5] px-4 py-3">
                <span className="text-[13px] font-semibold text-encre-douce">{source}</span>
                <span className="text-lg font-extrabold text-depense">{montant(total)} FCFA</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-titre text-2xl font-normal">À payer</h2>
        {aPayer.length === 0 ? (
          <p className="text-sm text-encre-pale">Aucune dépense en attente de paiement.</p>
        ) : (
          aPayer.map((d) => <Carte key={d.id} d={d} montrerJustif={parametres.afficherJustificatifs} />)
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-titre text-2xl font-normal">Payées</h2>
        {payees.length === 0 ? (
          <EtatVide titre="Aucune dépense payée pour le moment" />
        ) : (
          payees.map((d) => <Carte key={d.id} d={d} montrerJustif={parametres.afficherJustificatifs} />)
        )}
      </section>
    </GabaritFamille>
  );
}
