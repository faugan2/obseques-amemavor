import { useState } from 'react';
import { GabaritFamille } from './Gabarit';
import { Avatar, EtatVide, Puce, classes } from '../composants/ui';
import { IconeCategorie } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { dateLongue, montant } from '../lib/format';

export default function Nature() {
  const { dons, parametres } = useDonnees();
  const [categorie, setCategorie] = useState('Tout');
  const actifs = dons.filter((d) => !d.annule);
  const categories = ['Tout', ...parametres.categoriesDons];
  const compte = (c: string) => (c === 'Tout' ? actifs.length : actifs.filter((d) => d.categorie === c).length);
  const liste = dons.filter((d) => categorie === 'Tout' || d.categorie === categorie);

  return (
    <GabaritFamille
      titre="Dons en nature"
      sousTitre="Les biens et services offerts par la famille et les proches. Ils sont suivis à part et ne s'additionnent pas à l'argent de la caisse."
    >
      <div className="flex flex-wrap items-center gap-2 rounded-[20px] bg-white p-4 shadow-flottante sm:px-5" role="group" aria-label="Filtrer par catégorie">
        <span className="mr-1.5 text-[13px] font-bold text-encre-pale">Catégorie</span>
        {categories.map((c) => {
          const n = compte(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={categorie === c}
              onClick={() => setCategorie(c)}
              className={classes(
                'min-h-[40px] rounded-full px-3.5 text-[13px]',
                categorie === c ? 'bg-encre font-bold text-white' : 'border border-[#D8DBD3] bg-white font-semibold',
              )}
            >
              {c}
              {n > 0 && ` · ${n}`}
            </button>
          );
        })}
      </div>

      {liste.length === 0 ? (
        <EtatVide titre="Aucun don dans cette catégorie">Les dons en nature apparaîtront ici dès leur enregistrement.</EtatVide>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-5">
          {liste.map((d) => (
            <article key={d.id} className={classes('carte flex flex-col overflow-hidden', d.annule && 'opacity-60')}>
              <div className="flex items-start justify-between bg-nature-pale p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-nature">
                  <IconeCategorie categorie={d.categorie} taille={28} strokeWidth={1.8} />
                </div>
                {d.annule ? (
                  <Puce ton="annule">Annulé</Puce>
                ) : d.statut === 'recu' ? (
                  <span className="rounded-lg bg-recu px-2.5 py-1 text-xs font-bold text-white">Reçu</span>
                ) : (
                  <Puce ton="attente">{d.statut === 'partiel' ? 'Partiellement reçu' : 'Annoncé'}</Puce>
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-6 pt-5">
                <div className="text-xs font-bold uppercase tracking-[0.06em] text-nature">{d.categorie}</div>
                <div className="text-[28px] font-extrabold leading-tight">
                  {d.quantite} <span className="text-lg font-bold">{d.unite}</span>
                </div>
                <div className="text-sm text-encre-douce">{d.nature}</div>
                {d.valeurEstimee != null && parametres.afficherMontants && (
                  <div className="text-xs text-encre-pale">Valeur estimée : {montant(d.valeurEstimee)} FCFA (estimation, hors caisse)</div>
                )}
                <div className="my-2.5 h-px bg-trait" />
                <div className="flex items-center gap-2.5">
                  {parametres.afficherNoms && <Avatar nom={d.donateur} taille={32} />}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{parametres.afficherNoms ? d.donateur : 'Un proche de la famille'}</span>
                    <span className="text-xs text-encre-pale">{dateLongue(d.date)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </GabaritFamille>
  );
}
