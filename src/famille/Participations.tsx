import { useSearchParams } from 'react-router-dom';
import { GabaritFamille } from './Gabarit';
import { ParticipationsArgent } from './ParticipationsArgent';
import { ParticipationsNature } from './ParticipationsNature';
import { classes } from '../composants/ui';
import { IconeCadeau, IconeCoeur } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { donsParCategorie } from '../lib/calculs';
import { montant } from '../lib/format';

/** Participations des proches : en argent (comptées dans la caisse) et en nature (suivies à part). */
export default function Participations() {
  const [params, setParams] = useSearchParams();
  const onglet = params.get('onglet') === 'nature' ? 'nature' : 'argent';
  const { synthese: s, dons } = useDonnees();
  const resume = donsParCategorie(dons);

  const ONGLETS = [
    { v: 'argent', l: 'En argent', detail: `${montant(s.totalParticipations)} FCFA reçus`, icone: IconeCoeur },
    {
      v: 'nature',
      l: 'En nature',
      detail: resume.length ? resume.slice(0, 2).map((r) => `${r.quantite} ${r.unite}`).join(' · ') : `${s.nbDons} don${s.nbDons > 1 ? 's' : ''}`,
      icone: IconeCadeau,
    },
  ] as const;

  return (
    <GabaritFamille titre="Participations" sousTitre="Les dons des proches et amis de la famille, en argent ou en nature.">
      <div role="tablist" aria-label="Type de participation" className="grid grid-cols-2 gap-2 rounded-[20px] bg-white p-2 shadow-flottante">
        {ONGLETS.map((o) => {
          const actif = onglet === o.v;
          return (
            <button
              key={o.v}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setParams(o.v === 'nature' ? { onglet: 'nature' } : {}, { replace: true })}
              className={classes(
                'flex min-h-[60px] items-center gap-3 rounded-2xl px-4 text-left transition',
                actif ? (o.v === 'nature' ? 'bg-nature text-white' : 'bg-recu text-white') : 'text-encre hover:bg-fond',
              )}
            >
              <o.icone taille={22} className="shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="text-[15px] font-extrabold">{o.l}</span>
                <span className={classes('truncate text-xs', actif ? 'text-white/85' : 'text-encre-pale')}>{o.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
      {onglet === 'nature' ? <ParticipationsNature /> : <ParticipationsArgent />}
    </GabaritFamille>
  );
}
