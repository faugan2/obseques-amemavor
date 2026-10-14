import { GabaritFamille } from './Gabarit';
import { useDonnees } from '../lib/donnees';
import { montant } from '../lib/format';

function Emprunt({ e }: { e: any }) {
  const solde = e.montant - e.montantRembourse;
  const couleurStatut =
    e.statut === 'rembourse'
      ? 'text-recu'
      : e.statut === 'partielle'
        ? 'text-attente'
        : 'text-encre-douce';

  return (
    <div className="rounded-lg border border-trait bg-fond p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="font-bold text-encre">{e.preteur}</div>
          <div className="text-sm text-encre-pale">{e.date}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-encre">{montant(e.montant)} FCFA</div>
          <div className={`text-sm font-semibold ${couleurStatut}`}>
            {e.statut === 'rembourse' && 'Remboursé'}
            {e.statut === 'partielle' && `Partiellement (${montant(e.montantRembourse)} remboursé)`}
            {e.statut === 'annonce' && 'Annoncé'}
          </div>
        </div>
      </div>
      {e.dateRemboursement && (
        <div className="mb-2 text-sm text-encre-pale">
          Remboursement prévu : <span className="font-semibold text-encre">{e.dateRemboursement}</span>
        </div>
      )}
      {solde > 0 && (
        <div className="mb-2 rounded bg-attente-pale p-2 text-sm font-semibold text-attente">
          Solde restant : {montant(solde)} FCFA
        </div>
      )}
      {e.commentaire && <p className="text-sm text-encre-pale">{e.commentaire}</p>}
    </div>
  );
}

export default function Emprunts() {
  const { donnees } = useDonnees();
  const emprunts = donnees.emprunts || [];
  const totalEmprunts = emprunts.reduce((s: number, e: any) => s + e.montant, 0);
  const totalRestant = emprunts.reduce((s: number, e: any) => s + (e.montant - e.montantRembourse), 0);

  return (
    <GabaritFamille
      titre="Emprunts"
      sousTitre="Prêts accordés à la famille pour financer les obsèques."
    >
      {emprunts.length === 0 ? (
        <div className="carte p-6 text-center text-encre-pale">Aucun emprunt enregistré.</div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="carte flex flex-col gap-1 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Total emprunté</div>
              <div className="text-2xl font-bold text-encre">{montant(totalEmprunts)} FCFA</div>
            </div>
            <div className="carte flex flex-col gap-1 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.06em] text-encre-pale">Solde à rembourser</div>
              <div className={`text-2xl font-bold ${totalRestant > 0 ? 'text-attente' : 'text-recu'}`}>
                {montant(totalRestant)} FCFA
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {emprunts.map((e: any) => (
              <Emprunt key={e.id} e={e} />
            ))}
          </div>
        </div>
      )}
    </GabaritFamille>
  );
}
