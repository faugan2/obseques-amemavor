// Éléments partagés par les formulaires d'administration.
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Champ, MessageErreur, Modale, useNotifier } from '../composants/ui';
import { IconeAnnuler } from '../composants/icones';
import { annuler, type CollectionOperation } from '../lib/operations';
import { montant } from '../lib/format';
import { useDonnees } from '../lib/donnees';

export function messageEcriture(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code === 'permission-denied') {
    return "L'enregistrement a été refusé par le serveur (droits insuffisants, données invalides ou suivi clôturé).";
  }
  if (code === 'unavailable') return 'Connexion impossible. Vérifiez votre accès à Internet puis réessayez.';
  if (e instanceof Error && e.message) return e.message;
  return "L'enregistrement a échoué. Réessayez.";
}

/** Carte « Effet sur la caisse » affichée à côté des formulaires financiers. */
export function EffetCaisse({ variation, reste, libelleVariation }: { variation: number; reste?: { libelle: string; valeur: number }; libelleVariation: string }) {
  const { synthese } = useDonnees();
  const nouveau = synthese.solde + variation;
  return (
    <section className="carte flex flex-col gap-3.5 p-6">
      <h2 className="font-titre text-xl font-normal">Effet sur la caisse</h2>
      <div className="flex justify-between text-sm text-encre-douce"><span>Solde actuel</span><span className="font-bold">{montant(synthese.solde)}</span></div>
      <div className={`flex justify-between text-sm ${variation >= 0 ? 'text-recu' : 'text-depense'}`}>
        <span>{libelleVariation}</span>
        <span className="font-extrabold">{variation >= 0 ? '+' : '−'}{montant(Math.abs(variation))}</span>
      </div>
      <div className="h-px bg-trait" />
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold">Nouveau solde</span>
        <span className={`text-[26px] font-extrabold ${nouveau < 0 ? 'text-depense' : 'text-recu'}`}>{montant(nouveau)}</span>
      </div>
      {nouveau < 0 && <div className="text-xs font-semibold text-depense-fonce">Le solde deviendra négatif. L'opération sera tout de même enregistrée.</div>}
      {reste && reste.valeur > 0 && (
        <div className="flex justify-between rounded-[10px] bg-attente-pale px-3 py-2.5 text-[13px] text-attente-fonce">
          <span>{reste.libelle}</span>
          <span className="font-extrabold">{montant(reste.valeur)}</span>
        </div>
      )}
    </section>
  );
}

/** Champ « motif de la correction », obligatoire en modification. */
export function MotifCorrection({ valeur, onChange, erreur }: { valeur: string; onChange: (v: string) => void; erreur?: string }) {
  return (
    <div className="rounded-2xl border border-[#EED9A4] bg-attente-pale/60 p-4">
      <Champ id="motifCorrection" libelle="Motif de la correction" erreur={erreur} aide="Conservé dans l'historique des modifications (ex. « erreur de saisie, le reçu indique 25 000 »).">
        <input id="motifCorrection" className={`champ ${erreur ? 'champ-erreur' : ''}`} value={valeur} onChange={(e) => onChange(e.target.value)} />
      </Champ>
    </div>
  );
}

/** Bouton + fenêtre d'annulation (motif obligatoire, aucune suppression). */
export function BoutonAnnulation({ collection, id, libelle, description }: { collection: CollectionOperation; id: string; libelle: string; description: ReactNode }) {
  const [ouverte, setOuverte] = useState(false);
  const [motif, setMotif] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const notifier = useNotifier();
  const naviguer = useNavigate();

  const confirmer = async () => {
    if (motif.trim().length < 3) {
      setErreur("Indiquez le motif de l'annulation (3 caractères minimum).");
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      await annuler(collection, id, libelle, motif);
      notifier(`« ${libelle} » a été annulée. Elle reste visible dans l'historique.`);
      setOuverte(false);
      naviguer('/admin');
    } catch (e) {
      setErreur(messageEcriture(e));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuverte(true)}
        className="flex min-h-[48px] items-center gap-2 rounded-[14px] border border-[#E7B9AB] bg-white px-4 text-sm font-bold text-depense-fonce hover:bg-depense-pale"
      >
        <IconeAnnuler taille={18} />
        Annuler cette opération
      </button>
      <Modale ouverte={ouverte} onFermer={() => setOuverte(false)} titre="Annuler une opération">
        <div className="flex flex-col gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-depense-pale text-depense"><IconeAnnuler taille={22} /></div>
          <div>
            <h2 className="font-titre text-[22px] font-normal">Annuler cette opération ?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-encre-douce">{description} Elle sera retirée des totaux mais restera visible dans l'historique. Cette action est définitive.</p>
          </div>
          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          <Champ id="motifAnnulation" libelle="Motif (obligatoire)">
            <textarea id="motifAnnulation" rows={2} className="champ py-3" value={motif} onChange={(e) => setMotif(e.target.value)} />
          </Champ>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => setOuverte(false)} className="min-h-[48px] flex-1 rounded-xl border border-bord bg-white text-sm font-bold">Garder</button>
            <button type="button" disabled={envoi} onClick={confirmer} className="min-h-[48px] flex-1 rounded-xl bg-depense text-sm font-extrabold text-white disabled:opacity-60">
              {envoi ? 'Annulation…' : "Annuler l'opération"}
            </button>
          </div>
        </div>
      </Modale>
    </>
  );
}

/** Bandeau affiché quand l'opération ne peut plus être modifiée. */
export function BandeauFige({ annulee, motif }: { annulee: boolean; motif?: string }) {
  return (
    <div className="rounded-2xl bg-encre p-4 text-sm text-white">
      {annulee ? (
        <>
          <strong>Opération annulée.</strong> Elle n'est plus comptée dans les totaux{motif ? ` (motif : ${motif})` : ''}. Elle ne peut plus être modifiée.
        </>
      ) : (
        <><strong>Suivi clôturé.</strong> Les opérations ne peuvent plus être modifiées.</>
      )}
    </div>
  );
}

export function BoutonsEnregistrer({ envoi, edition, couleur, libelle, onAutre }: { envoi: boolean; edition: boolean; couleur: string; libelle: string; onAutre?: () => void }) {
  return (
    <div className="flex flex-wrap gap-2.5 pt-1">
      <button type="submit" disabled={envoi} className={`min-h-[54px] flex-[1_1_220px] rounded-[14px] text-base font-extrabold text-white disabled:opacity-60 ${couleur}`}>
        {envoi ? 'Enregistrement…' : edition ? 'Enregistrer la correction' : libelle}
      </button>
      {!edition && onAutre && (
        <button type="button" disabled={envoi} onClick={onAutre} className="min-h-[54px] flex-[1_1_220px] rounded-[14px] border border-bord bg-white text-[15px] font-bold disabled:opacity-60">
          Enregistrer et en ajouter une autre
        </button>
      )}
    </div>
  );
}
