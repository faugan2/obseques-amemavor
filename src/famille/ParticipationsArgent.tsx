import { useMemo, useState } from 'react';
import { nomPublic, numerosContributeurs } from './confidentialite';
import { Avatar, Puce, classes } from '../composants/ui';
import { IconeCoeur, IconeRecherche } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { typeDe } from '../lib/calculs';
import { dateLongue, libelleMode, montant, pourRecherche } from '../lib/format';
import { MODES_PAIEMENT, type ModePaiement } from '../types';

const PAR_PAGE = 25;

export function ParticipationsArgent() {
  const { contributions: toutes, synthese: s, parametres } = useDonnees();
  const contributions = useMemo(() => toutes.filter((c) => typeDe(c) === 'participation'), [toutes]);
  const [recherche, setRecherche] = useState('');
  const [mode, setMode] = useState<ModePaiement | 'tous'>('tous');
  const [nb, setNb] = useState(PAR_PAGE);
  const numeros = numerosContributeurs(toutes);

  const recues = useMemo(() => {
    const q = pourRecherche(recherche);
    return contributions
      .filter((c) => c.montantRecu > 0)
      .filter((c) => mode === 'tous' || c.mode === mode)
      .filter((c) => !q || pourRecherche(nomPublic(c.contributeur, c.contributeurCle, parametres, numeros)).includes(q));
  }, [contributions, mode, recherche, parametres, numeros]);

  const promesses = contributions.filter((c) => !c.annule && c.montant > c.montantRecu);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[
          { l: 'Participations reçues', v: `${montant(s.totalParticipations)}`, u: 'FCFA', c: 'text-recu' },
          { l: 'Participants', v: String(s.nbParticipants), u: '', c: '' },
          { l: 'Annoncées, pas encore reçues', v: montant(s.promessesEnAttente), u: 'FCFA', c: 'text-attente' },
        ].map((k) => (
          <div key={k.l} className="flex flex-col gap-1 rounded-[20px] bg-white p-5 shadow-flottante">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">{k.l}</div>
            <div className={classes('text-[30px] font-extrabold', k.c)}>
              {k.v} {k.u && <span className="text-[15px]">{k.u}</span>}
            </div>
          </div>
        ))}
      </div>

      <section className="carte">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-trait p-4 sm:px-6">
          <div className="relative w-full max-w-[380px] flex-1">
            <IconeRecherche taille={18} className="absolute left-3.5 top-[13px] text-encre-pale" />
            <input
              type="search"
              aria-label="Rechercher un participant"
              placeholder="Rechercher un nom…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="min-h-[44px] w-full rounded-full border border-[#D8DBD3] bg-[#F7F8F5] pl-11 pr-4 text-sm outline-none focus:border-recu"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par mode">
            {[{ valeur: 'tous' as const, libelle: 'Tous' }, ...MODES_PAIEMENT].map((m) => (
              <button
                key={m.valeur}
                type="button"
                aria-pressed={mode === m.valeur}
                onClick={() => setMode(m.valeur)}
                className={classes(
                  'min-h-[40px] rounded-full px-3.5 text-[13px]',
                  mode === m.valeur ? 'bg-encre font-bold text-white' : 'border border-[#D8DBD3] bg-white font-semibold',
                )}
              >
                {m.libelle}
              </button>
            ))}
          </div>
        </div>

        {recues.length === 0 ? (
          <p className="p-6 text-sm text-encre-pale">Aucune participation ne correspond.</p>
        ) : (
          <ul>
            {recues.slice(0, nb).map((c, i) => {
              const nom = nomPublic(c.contributeur, c.contributeurCle, parametres, numeros);
              return (
                <li key={c.id} className={classes('flex items-center gap-3.5 px-4 py-3.5 sm:px-6', i > 0 && 'border-t border-trait', c.annule && 'opacity-60')}>
                  <Avatar nom={nom} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className={classes('truncate font-bold', c.annule && 'line-through')}>{nom}</span>
                    <span className="text-[13px] text-encre-pale">
                      {dateLongue(c.date)} · {libelleMode(c.mode)}
                      {c.montantRecu < c.montant && ' · versement partiel'}
                    </span>
                  </div>
                  {c.annule ? (
                    <Puce ton="annule">Annulée</Puce>
                  ) : parametres.afficherMontants ? (
                    <span className="whitespace-nowrap text-base font-extrabold text-recu">+{montant(c.montantRecu)}</span>
                  ) : (
                    <Puce ton="recu">Reçu</Puce>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {recues.length > nb && (
          <div className="border-t border-trait p-4 text-center">
            <button type="button" onClick={() => setNb(nb + PAR_PAGE)} className="min-h-[44px] rounded-xl border border-bord px-5 text-sm font-bold">
              Afficher plus ({recues.length - nb} restantes)
            </button>
          </div>
        )}
        <div className="flex items-center justify-between border-t-2 border-encre px-4 py-4 sm:px-6">
          <span className="font-extrabold">Total des participations</span>
          <span className="text-lg font-extrabold text-recu">{montant(s.totalParticipations)} FCFA</span>
        </div>
      </section>

      <section className="flex flex-wrap items-start gap-4 rounded-[20px] border-[1.5px] border-dashed border-[#C9CDC4] p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-attente-pale text-attente"><IconeCoeur taille={22} /></div>
        <div className="flex min-w-[260px] flex-1 flex-col gap-1">
          <div className="text-base font-bold">Participations annoncées</div>
          <p className="text-sm text-encre-pale">
            Les sommes annoncées s'affichent ici, à part, tant qu'elles ne sont pas reçues : elles ne comptent pas dans la caisse.
          </p>
          {promesses.length === 0 ? (
            <p className="mt-2 text-sm font-semibold">Aucune participation en attente.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {promesses.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <span className="font-semibold">{nomPublic(c.contributeur, c.contributeurCle, parametres, numeros)}</span>
                  {parametres.afficherMontants && (
                    <span className="whitespace-nowrap font-bold text-attente">reste {montant(c.montant - c.montantRecu)} FCFA</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
