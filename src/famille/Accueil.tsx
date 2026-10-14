import { Link } from 'react-router-dom';
import { GabaritFamille } from './Gabarit';
import { Ceremonies } from './Ceremonies';
import { IconeAlerte, IconeBudget, IconePersonne } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { montant } from '../lib/format';

function Heros() {
  const { parametres } = useDonnees();
  return (
    <div className="conteneur flex flex-wrap items-center gap-6 pb-28 pt-10 sm:gap-10 sm:pt-12">
      <div className="h-[110px] w-[110px] shrink-0 rounded-full border-2 border-or p-[5px] sm:h-[120px] sm:w-[120px]">
        {parametres.photoUrl ? (
          <img src={parametres.photoUrl} alt={`Photo de ${parametres.nomDefunt}`} className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-foret-clair text-or">
            <IconePersonne taille={34} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex min-w-[260px] flex-1 flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-[0.16em] text-or">En mémoire de</div>
        <h1 className="font-titre text-[38px] font-normal leading-[1.05] sm:text-[48px]">{parametres.nomDefunt}</h1>
        {parametres.dates && <div className="text-[15px] text-[#D9E3DF]">{parametres.dates}</div>}
        {parametres.citation && <div className="font-titre text-lg italic text-or-clair">{parametres.citation}</div>}
        <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-[#C9D5D0]">
          <strong className="font-semibold text-white">Suivi des contributions et dépenses.</strong> {parametres.texteAccueil}
        </p>
      </div>
    </div>
  );
}

export default function Accueil() {
  const { synthese: s, budget: b } = useDonnees();
  const pctBudget = b.totalPrevision > 0 ? Math.min(100, Math.round((b.totalEngage / b.totalPrevision) * 100)) : 0;

  return (
    <GabaritFamille entete={<Heros />}>
      {b.lignes.length > 0 && (
        <Link to="/budget" className="carte flex flex-col gap-3 p-5 text-encre no-underline sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-attente-pale text-attente"><IconeBudget /></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Budget prévisionnel</span>
                <span className="text-xl font-extrabold">{montant(b.totalPrevision)} FCFA</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>Engagé : <strong>{montant(b.totalEngage)}</strong></span>
              <span>Payé : <strong className="text-depense">{montant(b.totalRealise)}</strong></span>
              <span>Reste à financer : <strong className="text-attente">{montant(Math.max(0, b.totalPrevision - s.totalEncaisse))}</strong></span>
            </div>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-md bg-trait" role="img" aria-label={`${pctBudget} % du budget engagé`}>
            <div className="h-full bg-attente-barre" style={{ width: `${pctBudget}%` }} />
          </div>
          <div className="flex justify-between text-xs font-semibold text-encre-pale">
            <span>{pctBudget} % du budget engagé · {b.lignes.length} postes</span>
            <span className="font-bold text-recu">Voir le budget</span>
          </div>
        </Link>
      )}

      <Ceremonies />

      {s.solde < 0 && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-[#E7B9AB] bg-depense-pale p-4 text-sm font-semibold text-depense-fonce">
          <IconeAlerte taille={20} className="shrink-0" />
          Les dépenses payées dépassent l'argent reçu de {montant(-s.solde)} FCFA.
        </div>
      )}

      <section className="flex flex-col gap-2 rounded-[20px] bg-foret p-6 text-white">
        <div className="font-titre text-[22px] text-or-clair">Merci à chacun</div>
        <p className="text-sm leading-relaxed text-[#C9D5D0]">
          La famille remercie tous ceux qui soutiennent l'organisation des obsèques, par leur contribution, leur présence ou leur aide.
        </p>
      </section>
    </GabaritFamille>
  );
}
