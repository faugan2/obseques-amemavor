import { useState } from 'react';
import { GabaritFamille } from './Gabarit';
import { EtatVide, Puce, classes } from '../composants/ui';
import { IconeDocument } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { dateLongue, montant } from '../lib/format';
import { STATUTS_DEVIS, type StatutDevis } from '../types';

const TON: Record<StatutDevis, 'attente' | 'recu' | 'neutre'> = { recu: 'attente', retenu: 'recu', refuse: 'neutre' };

export default function Devis() {
  const { devis, postes } = useDonnees();
  const [statut, setStatut] = useState<StatutDevis | 'tous'>('tous');
  const actifs = devis.filter((d) => !d.annule);
  const liste = actifs.filter((d) => statut === 'tous' || d.statut === statut);
  const nomPoste = (id: string) => postes.find((p) => p.id === id)?.libelle ?? 'Sans poste';
  const retenus = actifs.filter((d) => d.statut === 'retenu');

  // Regroupement par poste du budget, pour comparer les devis d'un même besoin.
  const groupes = [...new Set(liste.map((d) => d.posteId))]
    .map((id) => ({ id, nom: nomPoste(id), devis: liste.filter((d) => d.posteId === id).sort((a, b) => a.montant - b.montant) }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <GabaritFamille titre="Devis prestataires" sousTitre="Les devis demandés aux prestataires (tente, traiteur, chaises…), pour comparer les offres et suivre celles qui sont retenues.">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[
          { l: 'Devis reçus', v: String(actifs.length), u: '' },
          { l: 'Devis retenus', v: String(retenus.length), u: '' },
          { l: 'Montant retenu', v: montant(retenus.reduce((s, d) => s + d.montant, 0)), u: 'FCFA' },
        ].map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-[20px] bg-white p-5 shadow-flottante">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">{k.l}</div>
            <div className="text-[30px] font-extrabold">
              {k.v} {k.u && <span className="text-[15px]">{k.u}</span>}
            </div>
          </div>
        ))}
      </div>

      {actifs.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-[20px] bg-white p-4 shadow-carte" role="group" aria-label="Filtrer par statut">
          {[{ valeur: 'tous' as const, libelle: 'Tous' }, ...STATUTS_DEVIS].map((s) => (
            <button
              key={s.valeur}
              type="button"
              aria-pressed={statut === s.valeur}
              onClick={() => setStatut(s.valeur)}
              className={classes('min-h-[40px] rounded-full px-3.5 text-[13px]', statut === s.valeur ? 'bg-encre font-bold text-white' : 'border border-[#D8DBD3] bg-white font-semibold')}
            >
              {s.libelle}
            </button>
          ))}
        </div>
      )}

      {liste.length === 0 ? (
        <EtatVide titre={actifs.length ? 'Aucun devis avec ce statut' : 'Aucun devis pour le moment'}>
          Les devis des prestataires apparaîtront ici dès leur enregistrement par le trésorier.
        </EtatVide>
      ) : (
        groupes.map((g) => (
          <section key={g.id} className="flex flex-col gap-3">
            <h2 className="font-titre text-[22px] font-normal">{g.nom}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {g.devis.map((d) => (
                <article key={d.id} className={classes('carte flex flex-col gap-2 p-5', d.statut === 'retenu' && 'ring-2 ring-recu', d.statut === 'refuse' && 'opacity-70')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-fond text-encre-douce"><IconeDocument /></div>
                    <Puce ton={TON[d.statut]}>{STATUTS_DEVIS.find((s) => s.valeur === d.statut)?.libelle}</Puce>
                  </div>
                  <div className="text-base font-extrabold">{d.prestataire}</div>
                  {d.objet && <div className="text-sm text-encre-douce">{d.objet}</div>}
                  <div className="text-[26px] font-extrabold">{montant(d.montant)} <span className="text-sm">FCFA</span></div>
                  <div className="text-xs text-encre-pale">
                    {dateLongue(d.date)}
                    {d.reference && ` · Réf. ${d.reference}`}
                  </div>
                  {d.commentaire && <div className="rounded-lg bg-[#F7F8F5] px-3 py-2 text-[13px] text-encre-douce">{d.commentaire}</div>}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </GabaritFamille>
  );
}
