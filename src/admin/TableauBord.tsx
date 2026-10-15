import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { Puce, classes } from '../composants/ui';
import { IconeAlerte, IconeHorloge, IconeDocument } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { statutContribution, toutesOperations, type Operation, type TypeOperation } from '../lib/calculs';
import { dateCourte, montant, pourRecherche } from '../lib/format';
import type { Contribution, Depense, Don } from '../types';

const PAR_PAGE = 20;

const LIBELLE_TYPE: Record<TypeOperation, string> = {
  cotisation: 'Cotisation',
  participation: 'Participation',
  don: 'Participation en nature',
  depense: 'Dépense',
};
const ROUTE: Record<TypeOperation, string> = { cotisation: 'contribution', participation: 'contribution', don: 'don', depense: 'depense' };

const PAGES: Record<TypeOperation, { titre: string; sousTitre: string; nouveau: string; vers: string; couleur: string }> = {
  cotisation: { titre: 'Cotisations', sousTitre: 'Quotes-parts de la famille, par groupe familial.', nouveau: '+ Nouvelle cotisation', vers: '/admin/cotisation/nouvelle', couleur: 'bg-recu' },
  participation: { titre: 'Participations en argent', sousTitre: 'Dons libres en argent des proches et amis.', nouveau: '+ Nouvelle participation', vers: '/admin/participation/nouvelle', couleur: 'bg-[#1F4E8C]' },
  don: { titre: 'Participations en nature', sousTitre: 'Biens et services offerts (boissons, riz, chaises…).', nouveau: '+ Participation en nature', vers: '/admin/don/nouveau', couleur: 'bg-nature' },
  depense: { titre: 'Dépenses', sousTitre: 'Chaque dépense est rattachée à un poste du budget.', nouveau: '+ Nouvelle dépense', vers: '/admin/depense/nouvelle', couleur: 'bg-depense' },
};

function Statut({ o }: { o: Operation }) {
  if (o.annule) return <Puce ton="annule">Annulée</Puce>;
  if (o.type === 'cotisation' || o.type === 'participation') {
    const s = statutContribution(o.source as Contribution);
    return s === 'recue' ? <Puce ton="recu">Reçue</Puce> : s === 'partielle' ? <Puce ton="attente">Partielle</Puce> : <Puce ton="attente">Promise</Puce>;
  }
  if (o.type === 'don') {
    const s = (o.source as Don).statut;
    return <Puce ton="nature">{s === 'recu' ? 'Reçu' : s === 'partiel' ? 'Partiel' : 'Annoncé'}</Puce>;
  }
  const s = (o.source as Depense).statut;
  return s === 'payee' ? <Puce ton="recu">Payée</Puce> : s === 'partielle' ? <Puce ton="attente">Partielle</Puce> : <Puce ton="attente">Prévue</Puce>;
}

function Montant({ o }: { o: Operation }) {
  if (o.type === 'don') return <span className="text-encre-pale">—</span>;
  if (o.type === 'cotisation' || o.type === 'participation') {
    const c = o.source as Contribution;
    return c.montantRecu > 0 ? (
      <span className="font-extrabold text-recu">+{montant(c.montantRecu)}</span>
    ) : (
      <span className="font-bold text-attente">{montant(c.montant)}</span>
    );
  }
  const d = o.source as Depense;
  return d.montantPaye > 0 ? (
    <span className="font-extrabold text-depense">{montant(d.montantPaye)}</span>
  ) : (
    <span className="font-bold text-attente">{montant(d.montant)}</span>
  );
}

export default function TableauBord({ typeFixe }: { typeFixe?: TypeOperation }) {
  const { contributions, dons, depenses, emprunts, synthese: s, budget: b, parametres } = useDonnees();
  const [typeChoisi, setType] = useState<TypeOperation | 'tous'>('tous');
  const type = typeFixe ?? typeChoisi;
  const page = typeFixe ? PAGES[typeFixe] : null;
  const [categorie, setCategorie] = useState('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [recherche, setRecherche] = useState('');
  const [annulees, setAnnulees] = useState(true);
  const [numPage, setPage] = useState(0);

  const toutes = useMemo(() => toutesOperations(contributions, dons, depenses), [contributions, dons, depenses]);
  const categories = useMemo(
    () => [...new Set(toutes.filter((o) => type === 'tous' || o.type === type).map((o) => o.categorie).filter(Boolean))].sort(),
    [toutes, type],
  );

  const filtrees = useMemo(() => {
    const q = pourRecherche(recherche);
    return toutes.filter(
      (o) =>
        (type === 'tous' || o.type === type) &&
        (!categorie || o.categorie === categorie) &&
        (!du || o.date >= du) &&
        (!au || o.date <= au) &&
        (annulees || !o.annule) &&
        (!q || pourRecherche(`${o.libelle} ${o.detail} ${o.categorie}`).includes(q)),
    );
  }, [toutes, type, categorie, du, au, recherche, annulees]);

  const nbPages = Math.max(1, Math.ceil(filtrees.length / PAR_PAGE));
  const pageCourante = Math.min(numPage, nbPages - 1);
  const visibles = filtrees.slice(pageCourante * PAR_PAGE, (pageCourante + 1) * PAR_PAGE);
  const changer = <T,>(f: (v: T) => void) => (v: T) => {
    f(v);
    setPage(0);
  };

  const fermes = parametres.cloture;

  return (
    <GabaritAdmin
      titre={page ? page.titre : 'Tableau de bord'}
      sousTitre={page ? page.sousTitre : 'Tous les totaux sont calculés automatiquement à partir des opérations enregistrées.'}
      actions={
        page && !fermes ? (
          <Link to={page.vers} className={classes('inline-flex min-h-[46px] items-center rounded-xl px-5 text-sm font-extrabold text-white no-underline', page.couleur)}>
            {page.nouveau}
          </Link>
        ) : undefined
      }
    >
      {!page && !fermes && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
          {[
            { vers: '/admin/cotisation/nouvelle', t: 'Cotisation', a: 'Quote-part de la famille', c: 'bg-recu' },
            { vers: '/admin/participation/nouvelle', t: 'Participation', a: 'Don libre en argent', c: 'bg-[#1F4E8C]' },
            { vers: '/admin/don/nouveau', t: 'En nature', a: 'Boissons, riz, chaises…', c: 'bg-nature' },
            { vers: '/admin/depense/nouvelle', t: 'Dépense', a: 'Payée, partielle ou prévue', c: 'bg-depense' },
          ].map((x) => (
            <Link key={x.vers} to={x.vers} className={classes('flex min-h-[80px] items-center gap-3.5 rounded-[20px] p-4 text-white no-underline transition hover:brightness-110', x.c)}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/15 text-[26px]" aria-hidden="true">+</span>
              <span className="flex flex-col">
                <span className="text-base font-extrabold">{x.t}</span>
                <span className="text-[13px] opacity-90">{x.a}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      {!page && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
            {[
              { l: 'Caisse reçue', v: s.totalEncaisse, d: 'Cotisations + Participations + Emprunts', c: 'text-recu' },
              { l: 'Dépenses payées', v: s.totalDepense, d: `${s.nbDepenses} dépense${s.nbDepenses > 1 ? 's' : ''}`, c: 'text-depense' },
              { l: 'Solde disponible', v: s.solde, d: 'Caisse − dépenses payées', c: s.solde < 0 ? 'text-depense' : 'text-recu' },
              { l: 'Budget prévu', v: b.totalPrevision, d: `${b.lignes.length} postes · ${b.nbPostesNonChiffres} à chiffrer`, c: '' },
            ].map((k) => (
              <div key={k.l} className="flex flex-col gap-1 rounded-[18px] bg-white p-[18px] shadow-carte">
                <div className="text-xs font-bold text-encre-pale">{k.l}</div>
                <div className={classes('text-[26px] font-extrabold', k.c)}>{montant(k.v)}</div>
                <div className="text-xs text-encre-pale">{k.d}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
            {[
              { l: 'Cotisations', v: s.totalCotisations, d: `${montant(s.cotisationsAttendues)} encore attendus`, c: 'text-recu' },
              { l: 'Participations', v: s.totalParticipations, d: `${s.nbParticipants} participant${s.nbParticipants > 1 ? 's' : ''}`, c: 'text-[#1F4E8C]' },
              { l: 'Emprunts', v: s.totalEmprunts, d: `${emprunts.filter(e => !e.annule).length} emprunt${emprunts.filter(e => !e.annule).length > 1 ? 's' : ''}`, c: 'text-encre' },
              { l: 'Reste à payer', v: s.resteAPayer, d: `${s.nbDepensesNonSoldees} non soldée${s.nbDepensesNonSoldees > 1 ? 's' : ''}`, c: 'text-attente' },
            ].map((k) => (
              <div key={k.l} className="flex flex-col gap-1 rounded-[18px] bg-white p-[18px] shadow-carte">
                <div className="text-xs font-bold text-encre-pale">{k.l}</div>
                <div className={classes('text-[26px] font-extrabold', k.c)}>{montant(k.v)}</div>
                <div className="text-xs text-encre-pale">{k.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <section className="carte min-w-0 flex-[999_1_560px]">
          <div className="flex flex-col gap-3 border-b border-trait p-5">
            <h2 className="font-titre text-[22px] font-normal">{page ? `Liste (${filtrees.length})` : 'Toutes les opérations'}</h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                aria-label="Rechercher un nom ou une description"
                placeholder="Rechercher un nom, une description…"
                value={recherche}
                onChange={(e) => changer(setRecherche)(e.target.value)}
                className="min-h-[40px] min-w-[200px] flex-1 rounded-full border border-[#D8DBD3] bg-[#F7F8F5] px-4 text-sm outline-none focus:border-recu"
              />
              {!typeFixe && (
                <select aria-label="Type d'opération" value={type} onChange={(e) => changer(setType)(e.target.value as TypeOperation | 'tous')} className="min-h-[40px] rounded-full border border-[#D8DBD3] bg-white px-3 text-sm">
                  <option value="tous">Tous les types</option>
                  <option value="cotisation">Cotisations</option>
                  <option value="participation">Participations en argent</option>
                  <option value="don">Participations en nature</option>
                  <option value="depense">Dépenses</option>
                </select>
              )}
              <select aria-label="Catégorie" value={categorie} onChange={(e) => changer(setCategorie)(e.target.value)} className="min-h-[40px] max-w-[220px] rounded-full border border-[#D8DBD3] bg-white px-3 text-sm">
                <option value="">Toutes catégories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label htmlFor="du" className="font-semibold text-encre-pale">Du</label>
              <input id="du" type="date" value={du} onChange={(e) => changer(setDu)(e.target.value)} className="min-h-[40px] rounded-full border border-[#D8DBD3] bg-white px-3" />
              <label htmlFor="au" className="font-semibold text-encre-pale">au</label>
              <input id="au" type="date" value={au} onChange={(e) => changer(setAu)(e.target.value)} className="min-h-[40px] rounded-full border border-[#D8DBD3] bg-white px-3" />
              <label className="ml-auto flex items-center gap-2 font-semibold">
                <input type="checkbox" checked={annulees} onChange={(e) => changer(setAnnulees)(e.target.checked)} className="h-4 w-4 accent-recu" />
                Afficher les annulées
              </label>
            </div>
          </div>

          {visibles.length === 0 ? (
            <p className="p-6 text-sm text-encre-pale">Aucune opération ne correspond à ces critères.</p>
          ) : (
            <>
              {/* Tableau sur grand écran */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.05em] text-encre-pale">
                      <th className="px-5 py-3 font-bold">Date</th>
                      <th className="px-2.5 py-3 font-bold">Opération</th>
                      <th className="px-2.5 py-3 text-right font-bold">Montant</th>
                      <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((o) => (
                      <tr key={`${o.type}-${o.id}`} className={classes('border-t border-trait', o.annule && 'opacity-60')}>
                        <td className="whitespace-nowrap px-5 py-3.5 text-encre-douce">{dateCourte(o.date)}</td>
                        <td className="px-2.5 py-3.5">
                          <div className={classes('font-bold', o.annule && 'line-through')}>{o.libelle}</div>
                          <div className="text-xs text-encre-pale">{[LIBELLE_TYPE[o.type], o.categorie || o.detail].filter(Boolean).join(' · ')}</div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3.5 text-right"><Montant o={o} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <Link to={`/admin/${ROUTE[o.type]}/${o.id}`} className="inline-flex min-h-[36px] items-center rounded-[10px] border border-[#D8DBD3] px-3 text-[13px] font-bold text-encre no-underline hover:bg-fond">
                            {o.annule || fermes ? 'Voir' : 'Modifier'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Cartes sur téléphone */}
              <ul className="md:hidden">
                {visibles.map((o, i) => (
                  <li key={`${o.type}-${o.id}`} className={classes(i > 0 && 'border-t border-trait', o.annule && 'opacity-60')}>
                    <Link to={`/admin/${ROUTE[o.type]}/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 text-encre no-underline">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className={classes('truncate font-bold', o.annule && 'line-through')}>{o.libelle}</span>
                        <span className="text-xs text-encre-pale">{dateCourte(o.date)} · {LIBELLE_TYPE[o.type]}</span>
                      </div>
                      <Montant o={o} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-trait px-5 py-3 text-[13px] text-encre-pale">
            <span>{filtrees.length} opération{filtrees.length > 1 ? 's' : ''}</span>
            {nbPages > 1 && (
              <div className="flex items-center gap-2">
                <button type="button" disabled={pageCourante === 0} onClick={() => setPage(pageCourante - 1)} className="min-h-[36px] rounded-lg border border-bord px-3 font-bold disabled:opacity-40">Précédent</button>
                <span>Page {pageCourante + 1} / {nbPages}</span>
                <button type="button" disabled={pageCourante >= nbPages - 1} onClick={() => setPage(pageCourante + 1)} className="min-h-[36px] rounded-lg border border-bord px-3 font-bold disabled:opacity-40">Suivant</button>
              </div>
            )}
          </div>
        </section>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <section className="carte flex flex-col gap-3 p-5">
            <h2 className="font-titre text-xl font-normal">À surveiller</h2>
            {s.solde < 0 && (
              <div className="flex gap-2.5 rounded-xl bg-depense-pale p-3 text-[13px] text-depense-fonce">
                <IconeAlerte taille={18} className="shrink-0" />
                <span><strong>Solde négatif</strong> : {montant(-s.solde)} FCFA de dépenses en plus de l'argent reçu.</span>
              </div>
            )}
            {s.nbDepensesNonSoldees > 0 && (
              <div className="flex gap-2.5 rounded-xl bg-attente-pale p-3 text-[13px] text-attente-fonce">
                <IconeHorloge taille={18} className="shrink-0" />
                <span><strong>{s.nbDepensesNonSoldees} dépense{s.nbDepensesNonSoldees > 1 ? 's' : ''} à régler</strong> : {montant(s.resteAPayer)} FCFA.</span>
              </div>
            )}
            {s.nbPromesses > 0 && (
              <div className="flex gap-2.5 rounded-xl bg-fond p-3 text-[13px] text-encre-douce">
                <IconeHorloge taille={18} className="shrink-0" />
                <span><strong>{s.nbPromesses} promesse{s.nbPromesses > 1 ? 's' : ''}</strong> en attente : {montant(s.promessesEnAttente)} FCFA.</span>
              </div>
            )}
            <div className="flex gap-2.5 rounded-xl bg-fond p-3 text-[13px] text-encre-douce">
              <IconeDocument taille={18} className="shrink-0" />
              <span>Dernière sauvegarde exportée : <strong>{parametres.derniereSauvegarde ? dateCourte(parametres.derniereSauvegarde) : 'jamais'}</strong>.</span>
            </div>
          </section>
          <section className="flex flex-col gap-3 rounded-[20px] bg-foret p-5 text-white">
            <h2 className="font-titre text-xl font-normal text-or-clair">Partager un bilan</h2>
            <p className="text-[13px] text-[#C9D5D0]">Rapport prêt pour le groupe familial ou la réunion.</p>
            <Link to="/admin/rapport" className="inline-flex min-h-[40px] items-center self-start rounded-[10px] bg-white px-4 text-[13px] font-extrabold text-foret no-underline">
              Ouvrir le rapport (PDF, Excel, impression)
            </Link>
          </section>
        </div>
      </div>
    </GabaritAdmin>
  );
}
