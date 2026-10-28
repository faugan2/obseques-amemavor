import { useState } from 'react';
import { GabaritAdmin } from './Gabarit';
import { MessageErreur } from '../composants/ui';
import { IconeImprimante, IconeTelecharger } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { EST_DEMO } from '../lib/espace';
import { exporterExcel } from '../lib/export';
import { typeDe } from '../lib/calculs';
import { dateCourte, dateHeure, libelleMode, montant } from '../lib/format';

const th = 'border-b-[1.5px] border-encre px-1.5 py-2 text-left font-bold';
const td = 'border-b border-[#C9CDC4] px-1.5 py-2 align-top';

export default function Rapport() {
  const { contributions, dons, depenses, emprunts, postes, devis, synthese: s, budget: b, parametres, libelles, budgetLignes } = useDonnees();
  const [erreur, setErreur] = useState('');
  const [export_, setExport] = useState(false);

  const recues = contributions.filter((c) => !c.annule && c.montantRecu > 0 && typeDe(c) === 'participation');
  const promesses = contributions.filter((c) => !c.annule && c.montant > c.montantRecu && typeDe(c) === 'participation');
  const donsActifs = dons.filter((d) => !d.annule);
  const empruntsActifs = emprunts.filter((e) => !e.annule);
  const payees = depenses.filter((d) => !d.annule && d.montantPaye > 0);
  const nonSoldees = depenses.filter((d) => !d.annule && d.montant > d.montantPaye);
  const annulees = [
    ...contributions.filter((c) => c.annule).map((c) => ({ id: c.id, t: 'Contribution', l: c.contributeur, m: c.motifAnnulation })),
    ...dons.filter((d) => d.annule).map((d) => ({ id: d.id, t: 'Don', l: `${d.quantite} ${d.unite} · ${d.donateur}`, m: d.motifAnnulation })),
    ...depenses.filter((d) => d.annule).map((d) => ({ id: d.id, t: 'Dépense', l: d.designation, m: d.motifAnnulation })),
  ];

  const excel = async () => {
    setErreur('');
    setExport(true);
    try {
      // Passer budgetLignes et libelles pour utiliser les nouvelles collections
      await exporterExcel(contributions, dons, depenses, postes, parametres.nomDefunt, devis, budgetLignes, libelles);
    } catch {
      setErreur("Le fichier Excel n'a pas pu être généré.");
    } finally {
      setExport(false);
    }
  };

  return (
    <GabaritAdmin
      titre="Rapport financier"
      sousTitre="À imprimer, enregistrer en PDF ou exporter vers Excel pour le groupe familial ou une réunion."
      actions={
        <div className="pas-imprimer flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="flex min-h-[44px] items-center gap-2 rounded-xl bg-foret px-4 text-sm font-extrabold text-white">
            <IconeImprimante taille={18} /> Imprimer / PDF
          </button>
          <button type="button" disabled={export_} onClick={excel} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-bord bg-white px-4 text-sm font-bold disabled:opacity-60">
            <IconeTelecharger taille={18} /> {export_ ? 'Préparation…' : 'Excel'}
          </button>
        </div>
      }
    >
      {erreur && <MessageErreur>{erreur}</MessageErreur>}
      <p className="pas-imprimer -mt-2 text-[13px] text-encre-pale">Pour un PDF : « Imprimer / PDF », puis choisir « Enregistrer au format PDF » comme imprimante.</p>

      <article className="mx-auto flex w-full max-w-[794px] flex-col gap-7 bg-white p-6 text-sm leading-normal shadow-flottante sm:p-[56px] print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-or pb-5">
          <div className="flex flex-col gap-1">
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-or-fonce">Rapport financier</div>
            <h1 className="font-titre text-[30px] font-normal leading-tight">Obsèques de {parametres.nomDefunt.replace(/^Feu /, 'feu ')}</h1>
            <div className="text-[13px] text-encre-douce">Généré le {dateHeure(Date.now())}</div>
          </div>
          {EST_DEMO && <div className="whitespace-nowrap rounded-md border-[1.5px] border-or-fonce px-2.5 py-1.5 text-[11px] font-extrabold text-or-fonce">DONNÉES FICTIVES</div>}
        </header>

        <section className="flex flex-col gap-2.5">
          <h2 className="font-titre text-[21px] font-normal">1. Point global</h2>
          <table className="w-full border-collapse text-[14px]">
            <tbody>
              <tr><td className={td}>Emprunts reçus</td><td className={`${td} text-right font-bold text-recu-fonce`}>{montant(s.totalEmprunts)}</td></tr>
              <tr><td className={td}>Participations en argent</td><td className={`${td} text-right font-bold text-recu-fonce`}>{montant(s.totalParticipations)}</td></tr>
              <tr className="bg-[#F3F4F0]"><td className="px-1.5 py-2 font-bold">Fond de roulement</td><td className={`px-1.5 py-2 text-right font-bold text-recu-fonce`}>{montant(s.totalEmprunts + s.totalParticipations)}</td></tr>
              <tr><td className={td}>Dépenses payées</td><td className={`${td} text-right font-bold text-depense-fonce`}>− {montant(s.totalDepense)}</td></tr>
              <tr><td className={td}>Remboursements emprunts</td><td className={`${td} text-right font-bold text-depense-fonce`}>− {montant(s.totalEmpruntsRembourses)}</td></tr>
              <tr className="text-[16px]"><td className="px-1.5 py-2.5 font-extrabold">Reliquat (solde en caisse)</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(s.solde)} FCFA</td></tr>
            </tbody>
          </table>
          <div className="text-xs text-encre-douce">
            Budget prévu : {montant(b.totalPrevision)} FCFA · engagé : {montant(b.totalEngage)} FCFA · reste à payer sur dépenses engagées : {montant(s.resteAPayer)} FCFA.
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="font-titre text-[21px] font-normal">2. Budget : prévisions et réalisations</h2>
          <table className="w-full border-collapse text-[12px]">
            <thead><tr><th className={th}>Poste</th><th className={th}>Responsable</th><th className={th}>Financement</th><th className={`${th} text-right`}>Prévu</th><th className={`${th} text-right`}>Payé</th></tr></thead>
            <tbody>
              {b.lignes.filter((l) => l.prevision > 0 || l.engage > 0).map((l) => (
                <tr key={l.poste.id}>
                  <td className={td}>{l.poste.libelle}</td><td className={td}>{l.poste.responsable}</td><td className={td}>{l.poste.financement}</td>
                  <td className={`${td} text-right`}>{l.prevision ? montant(l.prevision) : '—'}</td><td className={`${td} text-right`}>{l.realise ? montant(l.realise) : '—'}</td>
                </tr>
              ))}
              <tr><td colSpan={3} className="px-1.5 py-2.5 font-extrabold">Total</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(b.totalPrevision)}</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(b.totalRealise)}</td></tr>
            </tbody>
          </table>
          {b.nbPostesNonChiffres > 0 && <div className="text-xs text-encre-douce">{b.nbPostesNonChiffres} poste(s) encore à chiffrer ne figurent pas dans ce tableau.</div>}
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="font-titre text-[21px] font-normal">3. Participations en argent</h2>
          {recues.length === 0 ? <p className="text-encre-pale">Aucune.</p> : (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th className={th}>Date</th><th className={th}>Participant</th><th className={th}>Motif</th><th className={`${th} text-right`}>Reçu (FCFA)</th></tr></thead>
              <tbody>
                {recues.map((c) => (
                  <tr key={c.id}><td className={td}>{dateCourte(c.date)}</td><td className={td}>{c.contributeur}</td><td className={td}>{c.motif || libelleMode(c.mode)}</td><td className={`${td} text-right`}>{montant(c.montantRecu)}</td></tr>
                ))}
                <tr><td colSpan={3} className="px-1.5 py-2.5 font-extrabold">Total</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(s.totalParticipations)}</td></tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="font-titre text-[21px] font-normal">4. Participations en nature</h2>
          {donsActifs.length === 0 ? <p className="text-encre-pale">Aucune.</p> : (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th className={th}>Date</th><th className={th}>Donateur</th><th className={th}>Bien</th><th className={`${th} text-right`}>Quantité</th><th className={th}>État</th></tr></thead>
              <tbody>
                {donsActifs.map((d) => (
                  <tr key={d.id}><td className={td}>{dateCourte(d.date)}</td><td className={td}>{d.donateur}</td><td className={td}>{d.nature}</td><td className={`${td} text-right`}>{d.quantite} {d.unite}</td><td className={td}>{d.statut === 'recu' ? 'Reçu' : d.statut === 'partiel' ? 'Partiel' : 'Annoncé'}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="text-xs text-encre-douce">Les dons en nature ne sont pas inclus dans le solde financier. Les valeurs estimées éventuelles sont indicatives.</div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="font-titre text-[21px] font-normal">5. Emprunts</h2>
          {empruntsActifs.length === 0 ? <p className="text-encre-pale">Aucun.</p> : (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th className={th}>Date</th><th className={th}>Prêteur</th><th className={`${th} text-right`}>Montant (FCFA)</th><th className={`${th} text-right`}>Remboursé (FCFA)</th><th className={`${th} text-right`}>Solde (FCFA)</th><th className={th}>État</th></tr></thead>
              <tbody>
                {empruntsActifs.map((e) => (
                  <tr key={e.id}>
                    <td className={td}>{dateCourte(e.date)}</td>
                    <td className={td}><div className="font-semibold">{e.preteur}</div>{e.commentaire && <div className="text-xs text-encre-pale">{e.commentaire}</div>}</td>
                    <td className={`${td} text-right`}>{montant(e.montant)}</td>
                    <td className={`${td} text-right`}>{montant(e.montantRembourse)}</td>
                    <td className={`${td} text-right`}>{montant(e.montant - e.montantRembourse)}</td>
                    <td className={td}>{e.statut === 'rembourse' ? 'Remboursé' : e.statut === 'partielle' ? 'Partiellement remboursé' : 'Annoncé'}</td>
                  </tr>
                ))}
                <tr><td colSpan={2} className="px-1.5 py-2.5 font-extrabold">Total</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(s.totalEmprunts)}</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(s.totalEmpruntsRembourses)}</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(s.totalEmprunts - s.totalEmpruntsRembourses)}</td><td></td></tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="flex flex-col gap-2.5">
          <h2 className="font-titre text-[21px] font-normal">6. Dépenses payées</h2>
          {payees.length === 0 ? <p className="text-encre-pale">Aucune.</p> : (
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th className={th}>Date</th><th className={th}>Désignation</th><th className={th}>Poste</th><th className={th}>Responsable · financement</th><th className={`${th} text-right`}>Payé (FCFA)</th></tr></thead>
              <tbody>
                {payees.map((d) => (
                  <tr key={d.id}><td className={td}>{dateCourte(d.date)}</td><td className={td}>{d.designation}{d.statut === 'partielle' && ' (partiel)'}</td><td className={td}>{d.categorie}</td><td className={td}>{[d.responsable, d.financement].filter(Boolean).join(' · ') || '—'}</td><td className={`${td} text-right`}>{montant(d.montantPaye)}</td></tr>
                ))}
                <tr><td colSpan={4} className="px-1.5 py-2.5 font-extrabold">Total</td><td className="px-1.5 py-2.5 text-right font-extrabold">{montant(s.totalDepense)}</td></tr>
              </tbody>
            </table>
          )}
        </section>

        <section className="flex flex-col gap-2.5 rounded-[10px] border-[1.5px] border-dashed border-or-fonce p-4">
          <h2 className="font-titre text-[21px] font-normal">7. Restes à payer et sommes attendues (hors solde)</h2>
          <table className="w-full border-collapse text-[13px]">
            <thead><tr><th className={th}>Type</th><th className={th}>Libellé</th><th className={`${th} text-right`}>Reste (FCFA)</th></tr></thead>
            <tbody>
              {nonSoldees.map((d) => (
                <tr key={d.id}><td className={td}>Dépense {d.statut === 'partielle' ? 'partielle' : 'prévue'}</td><td className={td}>{d.designation}</td><td className={`${td} text-right`}>{montant(d.montant - d.montantPaye)}</td></tr>
              ))}
{promesses.map((c) => (
                <tr key={c.id}><td className={td}>Participation annoncée</td><td className={td}>{c.contributeur}</td><td className={`${td} text-right`}>{montant(c.montant - c.montantRecu)}</td></tr>
              ))}
              {nonSoldees.length + promesses.length === 0 && <tr><td colSpan={3} className={td}>Aucun engagement en attente.</td></tr>}
            </tbody>
          </table>
          <div className="text-[13px] font-bold">
            Solde prévisionnel (après règlement des dépenses et réception des sommes attendues) : {montant(s.solde - s.resteAPayer + s.promessesEnAttente)} FCFA
          </div>
        </section>

        {annulees.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="font-titre text-lg font-normal">Opérations annulées (pour mémoire)</h2>
            <ul className="list-disc pl-5 text-[13px] text-encre-douce">
              {annulees.map((a) => <li key={a.id}>{a.t} · {a.l}{a.m ? ` — ${a.m}` : ''}</li>)}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-2 gap-10 pt-6">
          <div className="flex flex-col gap-12"><div className="text-[13px] font-bold">Le trésorier</div><div className="border-t border-encre pt-1.5 text-xs text-encre-douce">Nom et signature</div></div>
          <div className="flex flex-col gap-12"><div className="text-[13px] font-bold">Vu par le chef de famille</div><div className="border-t border-encre pt-1.5 text-xs text-encre-douce">Nom et signature</div></div>
        </div>
      </article>
    </GabaritAdmin>
  );
}
