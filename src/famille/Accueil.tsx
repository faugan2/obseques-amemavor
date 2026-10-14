import { Link } from 'react-router-dom';
import { GabaritFamille } from './Gabarit';
import { Ceremonies } from './Ceremonies';
import { nomPublic, numerosContributeurs } from './confidentialite';
import { Avatar, Donut, EtatVide, Puce, classes } from '../composants/ui';
import { IconeAlerte, IconeBudget, IconeCadeau, IconeCoeur, IconeFlecheBas, IconeHorloge, IconePersonne, IconePersonnes } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { donsParCategorie, toutesOperations } from '../lib/calculs';
import { dateLongue, montant } from '../lib/format';
import type { Contribution, Depense, Don } from '../types';

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

function LigneOperation({
  icone,
  fond,
  titre,
  detail,
  droite,
  barre,
}: {
  icone: React.ReactNode;
  fond: string;
  titre: string;
  detail: string;
  droite: React.ReactNode;
  barre?: boolean;
}) {
  return (
    <div className={classes('flex items-center gap-3.5 px-5 py-3.5 sm:px-6', barre && 'border-t border-trait')}>
      <div className={classes('flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]', fond)}>{icone}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-[15px] font-bold">{titre}</div>
        <div className="truncate text-[13px] text-encre-pale">{detail}</div>
      </div>
      <div className="shrink-0">{droite}</div>
    </div>
  );
}

export default function Accueil() {
  const { contributions, dons, depenses, synthese: s, budget: b, parametres } = useDonnees();
  const numeros = numerosContributeurs(contributions);
  const ops = toutesOperations(contributions, dons, depenses).filter((o) => !o.annule).slice(0, 6);
  // « Où va l'argent » : les postes du budget où de l'argent a été engagé.
  const categories = [
    ...b.lignes.filter((l) => l.engage > 0).map((l) => ({ categorie: l.poste.libelle, paye: l.realise, reste: l.resteAPayer })),
    ...(b.horsBudget.engage > 0 ? [{ categorie: 'Hors budget', paye: b.horsBudget.realise, reste: b.horsBudget.engage - b.horsBudget.realise }] : []),
  ]
    .sort((x, y) => y.paye + y.reste - (x.paye + x.reste))
    .slice(0, 6);
  const maxCat = Math.max(1, ...categories.map((c) => c.paye + c.reste));
  const resumeDons = donsParCategorie(dons);
  const pctBudget = b.totalPrevision > 0 ? Math.min(100, Math.round((b.totalEngage / b.totalPrevision) * 100)) : 0;

  return (
    <GabaritFamille entete={<Heros />}>
      <section className="flex flex-wrap items-center gap-7 rounded-3xl bg-white p-6 shadow-flottante sm:p-7">
        <div className="flex min-w-[260px] flex-1 items-center gap-6">
          <Donut part={s.partUtilisee} taille={112} />
          <div className="flex flex-col gap-1.5">
            <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Solde en caisse</div>
            <div className={classes('text-[40px] font-extrabold leading-none tracking-tight sm:text-[48px]', s.solde < 0 ? 'text-depense' : 'text-recu')}>
              {montant(s.solde)} <span className="text-lg font-bold sm:text-xl">FCFA</span>
            </div>
            <div className="text-[13px] text-encre-pale">Cotisations + participations − dépenses payées</div>
          </div>
        </div>
        <div className="grid min-w-[280px] flex-[1.4] grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Link to="/cotisations" className="flex flex-col gap-1 rounded-2xl bg-recu-pale p-4 text-recu-fonce no-underline">
            <div className="flex items-center gap-1.5 text-xs font-bold"><IconePersonnes taille={14} strokeWidth={2.5} />Cotisations</div>
            <div className="text-2xl font-extrabold">{montant(s.totalCotisations)}</div>
            <div className="text-xs">{s.nbCotisants} cotisant{s.nbCotisants > 1 ? 's' : ''}</div>
          </Link>
          <Link to="/participations" className="flex flex-col gap-1 rounded-2xl bg-[#E6EEF8] p-4 text-[#1F4E8C] no-underline">
            <div className="flex items-center gap-1.5 text-xs font-bold"><IconeCoeur taille={14} strokeWidth={2.5} />Participations</div>
            <div className="text-2xl font-extrabold">{montant(s.totalParticipations)}</div>
            <div className="text-xs">{s.nbParticipants} participant{s.nbParticipants > 1 ? 's' : ''}</div>
          </Link>
          <Link to="/depenses" className="flex flex-col gap-1 rounded-2xl bg-depense-pale p-4 text-depense-fonce no-underline">
            <div className="flex items-center gap-1.5 text-xs font-bold"><IconeFlecheBas taille={14} strokeWidth={2.5} />Dépenses payées</div>
            <div className="text-2xl font-extrabold">{montant(s.totalDepense)}</div>
            <div className="text-xs">{s.nbDepenses} dépense{s.nbDepenses > 1 ? 's' : ''}</div>
          </Link>
        </div>
      </section>

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

      <div className="flex flex-wrap items-start gap-5">
        <section className="carte min-w-0 flex-[999_1_560px] py-2">
          <div className="flex items-baseline justify-between px-5 pb-2 pt-4 sm:px-6">
            <h2 className="font-titre text-2xl font-normal">Dernières opérations</h2>
            <Link to="/participations" className="text-[13px] font-bold text-recu no-underline">Tout voir</Link>
          </div>
          {ops.length === 0 && <p className="px-6 pb-6 text-sm text-encre-pale">Aucune opération enregistrée pour le moment.</p>}
          {ops.map((o, i) => {
            if (o.type === 'cotisation' || o.type === 'participation') {
              const c = o.source as Contribution;
              const nom = nomPublic(c.contributeur, c.contributeurCle, parametres, numeros);
              return (
                <LigneOperation
                  key={o.id}
                  barre={i > 0}
                  fond=""
                  icone={<Avatar nom={nom} taille={44} />}
                  titre={nom}
                  detail={`${dateLongue(c.date)} · ${o.type === 'cotisation' ? 'Cotisation' : 'Participation'}${c.montantRecu > 0 ? '' : ' annoncée'}`}
                  droite={
                    parametres.afficherMontants ? (
                      <span className="text-base font-extrabold text-recu">{c.montantRecu > 0 ? `+${montant(c.montantRecu)}` : <Puce ton="attente">Promis</Puce>}</span>
                    ) : (
                      <Puce ton="recu">{c.montantRecu > 0 ? 'Reçu' : 'Promis'}</Puce>
                    )
                  }
                />
              );
            }
            if (o.type === 'don') {
              const d = o.source as Don;
              return (
                <LigneOperation
                  key={o.id}
                  barre={i > 0}
                  fond="bg-nature-pale text-nature"
                  icone={<IconeCadeau />}
                  titre={`${d.quantite} ${d.unite} · ${d.nature}`}
                  detail={`${dateLongue(d.date)} · Don${parametres.afficherNoms ? ` de ${d.donateur}` : ''}`}
                  droite={<Puce ton="nature">{d.statut === 'recu' ? 'Reçu' : d.statut === 'partiel' ? 'Partiel' : 'Annoncé'}</Puce>}
                />
              );
            }
            const d = o.source as Depense;
            const prevue = d.statut !== 'payee';
            return (
              <LigneOperation
                key={o.id}
                barre={i > 0}
                fond={prevue ? 'bg-attente-pale text-attente' : 'bg-depense-pale text-depense'}
                icone={prevue ? <IconeHorloge /> : <IconeFlecheBas />}
                titre={d.designation}
                detail={`${dateLongue(d.date)} · ${d.statut === 'payee' ? 'Dépense payée' : d.statut === 'partielle' ? 'Paiement partiel' : 'Dépense prévue'}${d.responsable ? ` · ${d.responsable}` : ''}`}
                droite={
                  <span className={classes('text-base font-extrabold', prevue ? 'text-attente' : 'text-depense')}>
                    {d.montantPaye > 0 ? `−${montant(d.montantPaye)}` : montant(d.montant)}
                  </span>
                }
              />
            );
          })}
        </section>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section className="carte flex flex-col gap-4 p-6">
            <h2 className="font-titre text-[22px] font-normal">Où va l'argent</h2>
            {categories.length === 0 && <p className="text-sm text-encre-pale">Aucune dépense pour le moment.</p>}
            {categories.map((c) => (
              <div key={c.categorie} className="flex flex-col gap-2">
                <div className="flex justify-between gap-3 text-[13px] font-semibold">
                  <span>{c.categorie}</span>
                  <span className="whitespace-nowrap font-extrabold">{montant(c.paye + c.reste)}</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-md bg-trait">
                  <div className="h-full bg-depense" style={{ width: `${(c.paye / maxCat) * 100}%` }} />
                  <div className="h-full bg-attente-barre" style={{ width: `${(c.reste / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
            {categories.length > 0 && (
              <div className="flex gap-4 text-xs font-semibold text-encre-pale">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-depense" />Payé</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-attente-barre" />Reste à payer</span>
              </div>
            )}
          </section>

          <Link to="/participations?onglet=nature" className="carte flex items-center gap-3.5 px-6 py-5 text-encre no-underline">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-nature-pale text-nature"><IconeCadeau /></div>
            <div className="flex flex-1 flex-col">
              <span className="text-[15px] font-bold">{s.nbDons} don{s.nbDons > 1 ? 's' : ''} en nature</span>
              <span className="text-[13px] text-encre-pale">
                {resumeDons.length ? resumeDons.slice(0, 3).map((r) => `${r.quantite} ${r.unite}`).join(' · ') : 'Aucun pour le moment'}
              </span>
            </div>
            <span className="text-[13px] font-bold text-recu">Voir</span>
          </Link>

          <section className="flex flex-col gap-2 rounded-[20px] bg-foret p-6 text-white">
            <div className="font-titre text-[22px] text-or-clair">Merci à chacun</div>
            <p className="text-sm leading-relaxed text-[#C9D5D0]">
              La famille remercie tous ceux qui soutiennent l'organisation des obsèques, par leur contribution, leur présence ou leur aide.
            </p>
          </section>
        </div>
      </div>

      {contributions.length + dons.length + depenses.length === 0 && (
        <EtatVide titre="Le suivi commence bientôt">Les premières contributions et dépenses apparaîtront ici dès leur enregistrement par le trésorier.</EtatVide>
      )}
    </GabaritFamille>
  );
}
