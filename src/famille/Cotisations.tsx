import { GabaritFamille } from './Gabarit';
import { nomPublic, numerosContributeurs } from './confidentialite';
import { Avatar, Puce, classes } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { cotisationsParGroupe, statutContribution } from '../lib/calculs';
import { montant } from '../lib/format';

export default function Cotisations() {
  const { contributions, synthese: s, parametres } = useDonnees();
  const numeros = numerosContributeurs(contributions);
  const groupes = cotisationsParGroupe(contributions, parametres.groupesCotisation);
  const montrer = parametres.afficherMontants;

  return (
    <GabaritFamille titre="Cotisations" sousTitre="Les quotes-parts de la famille, par groupe familial : ce qui est attendu de chacun et ce qui a déjà été versé.">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[
          { l: 'Cotisations versées', v: `${montant(s.totalCotisations)}`, u: 'FCFA', c: 'text-recu' },
          { l: 'Restant à verser', v: montant(s.cotisationsAttendues), u: 'FCFA', c: 'text-attente' },
          { l: 'Cotisants', v: String(s.nbCotisants), u: '', c: '' },
        ].map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-[20px] bg-white p-5 shadow-flottante">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">{k.l}</div>
            <div className={classes('text-[30px] font-extrabold', k.c)}>
              {k.v} {k.u && <span className="text-[15px]">{k.u}</span>}
            </div>
          </div>
        ))}
      </div>

      {groupes.map((g) => {
        const pct = g.attendu ? Math.round((g.verse / g.attendu) * 100) : 0;
        return (
          <section key={g.groupe} className="carte overflow-hidden">
            <header className="flex flex-col gap-2.5 border-b border-trait p-5 sm:px-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-titre text-[22px] font-normal">{g.groupe}</h2>
                {montrer && g.attendu > 0 && (
                  <span className="text-sm">
                    <strong className="text-recu">{montant(g.verse)}</strong> versés sur {montant(g.attendu)} FCFA
                  </span>
                )}
              </div>
              {g.attendu > 0 && (
                <div className="flex h-2 overflow-hidden rounded bg-trait" role="img" aria-label={`${pct} % versé`}>
                  <div className="bg-recu" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              )}
            </header>
            {g.membres.length === 0 ? (
              <p className="px-5 py-4 text-sm text-encre-pale sm:px-6">Aucune cotisation enregistrée pour ce groupe pour le moment.</p>
            ) : (
              <ul>
                {g.membres.map((c, i) => {
                  const nom = nomPublic(c.contributeur, c.contributeurCle, parametres, numeros);
                  const st = statutContribution(c);
                  return (
                    <li key={c.id} className={classes('flex items-center gap-3.5 px-4 py-3 sm:px-6', i > 0 && 'border-t border-trait', c.annule && 'opacity-60')}>
                      <Avatar nom={nom} taille={36} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className={classes('truncate font-bold', c.annule && 'line-through')}>{nom}</span>
                        {montrer && (
                          <span className="text-[13px] text-encre-pale">
                            Quote-part {montant(c.montant)} FCFA{c.montantRecu < c.montant && c.montantRecu > 0 && ` · reste ${montant(c.montant - c.montantRecu)}`}
                          </span>
                        )}
                      </div>
                      {c.annule ? (
                        <Puce ton="annule">Annulée</Puce>
                      ) : st === 'recue' ? (
                        <Puce ton="recu">{montrer ? `Versé ${montant(c.montantRecu)}` : 'À jour'}</Puce>
                      ) : st === 'partielle' ? (
                        <Puce ton="attente">{montrer ? `Versé ${montant(c.montantRecu)}` : 'Partiel'}</Puce>
                      ) : (
                        <Puce ton="neutre">En attente</Puce>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </GabaritFamille>
  );
}
