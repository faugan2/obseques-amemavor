import { useEffect, useState } from 'react';
import { GabaritAdmin } from './Gabarit';
import { messageEcriture } from './communs';
import { Bascule, Champ, MessageErreur, Modale, classes, useNotifier } from '../composants/ui';
import { IconeCroix, IconePersonne } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { useAuth } from '../lib/auth';
import { EST_DEMO } from '../lib/espace';
import { chargerDonneesDemo, enregistrerParametres, televerserPhoto } from '../lib/operations';
import { telechargerSauvegarde } from '../lib/export';
import { aujourdHui, dateCourte } from '../lib/format';
import type { Ceremonie, Parametres as P } from '../types';

function ListeModifiable({ titre, valeurs, onChange }: { titre: string; valeurs: string[]; onChange: (v: string[]) => void }) {
  const [nouvelle, setNouvelle] = useState('');
  const ajouter = () => {
    const v = nouvelle.trim();
    if (v && !valeurs.includes(v)) onChange([...valeurs, v]);
    setNouvelle('');
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="etiquette">{titre}</div>
      <ul className="flex flex-wrap gap-2">
        {valeurs.map((v) => (
          <li key={v} className="flex items-center gap-1 rounded-[10px] bg-fond py-1 pl-3 pr-1 text-[13px] font-semibold">
            {v}
            <button type="button" aria-label={`Retirer ${v}`} onClick={() => onChange(valeurs.filter((x) => x !== v))} className="rounded-md p-1.5 text-encre-pale hover:bg-white">
              <IconeCroix taille={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          aria-label={`Ajouter à : ${titre}`}
          className="champ min-h-[44px]"
          placeholder="Nouvelle entrée…"
          value={nouvelle}
          onChange={(e) => setNouvelle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              ajouter();
            }
          }}
        />
        <button type="button" onClick={ajouter} className="min-h-[44px] shrink-0 rounded-xl border-[1.5px] border-dashed border-recu px-4 text-[13px] font-extrabold text-recu">
          + Ajouter
        </button>
      </div>
      <div className="text-xs text-encre-pale">Retirer une entrée ne modifie pas les opérations déjà enregistrées.</div>
    </div>
  );
}

function EditeurCeremonies({
  ceremonies,
  onChange,
  salutations,
  onSalutations,
}: {
  ceremonies: Ceremonie[];
  onChange: (v: Ceremonie[]) => void;
  salutations: string;
  onSalutations: (v: string) => void;
}) {
  const modifier = (i: number, champ: keyof Ceremonie, valeur: string) =>
    onChange(ceremonies.map((c, j) => (j === i ? { ...c, [champ]: valeur } : c)));
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-or/40 bg-[#FBF7EC] p-4">
      <div>
        <div className="font-titre text-lg italic text-[#7A5A16]">Cérémonies d'adieu</div>
        <div className="text-xs text-encre-pale">Affichées sur l'accueil familial, puis masquées automatiquement une fois leur date passée.</div>
      </div>
      {ceremonies.map((c, i) => (
        <fieldset key={i} className="grid gap-2 rounded-xl bg-white p-3 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
          <legend className="sr-only">Cérémonie {i + 1}</legend>
          <input aria-label="Date" type="date" className="champ min-h-[44px]" value={c.date} onChange={(e) => modifier(i, 'date', e.target.value)} />
          <input aria-label="Heure" className="champ min-h-[44px]" placeholder="18h30" value={c.heure} onChange={(e) => modifier(i, 'heure', e.target.value)} />
          <input aria-label="Cérémonie" className="champ min-h-[44px] [grid-column:1/-1]" placeholder="ex. Veillée de prières" value={c.titre} onChange={(e) => modifier(i, 'titre', e.target.value)} />
          <input aria-label="Lieu" className="champ min-h-[44px] [grid-column:1/-1]" placeholder="Lieu" value={c.lieu} onChange={(e) => modifier(i, 'lieu', e.target.value)} />
          <button type="button" onClick={() => onChange(ceremonies.filter((_, j) => j !== i))} className="justify-self-start text-[13px] font-bold text-depense-fonce [grid-column:1/-1]">
            Retirer cette cérémonie
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => onChange([...ceremonies, { date: '', heure: '', titre: '', lieu: '' }])}
        className="min-h-[44px] self-start rounded-xl border-[1.5px] border-dashed border-or-fonce px-4 text-[13px] font-extrabold text-or-fonce"
      >
        + Ajouter une cérémonie
      </button>
      <Champ id="salutations" libelle="Information sur les salutations" facultatif>
        <input id="salutations" className="champ" value={salutations} onChange={(e) => onSalutations(e.target.value)} />
      </Champ>
    </div>
  );
}

export default function Parametres() {
  const { parametres, contributions, dons, depenses } = useDonnees();
  const { utilisateur, reinitialiser } = useAuth();
  const notifier = useNotifier();
  const [p, setP] = useState<P>(parametres);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [modaleCloture, setModaleCloture] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => setP(parametres), [parametres]);

  const modifie = JSON.stringify({ ...p, derniereOperation: null }) !== JSON.stringify({ ...parametres, derniereOperation: null });
  const lien = `${window.location.origin}/`;
  const maj = <K extends keyof P>(k: K, v: P[K]) => setP((x) => ({ ...x, [k]: v }));

  const executer = async (action: () => Promise<void>, succes: string) => {
    setErreur('');
    setEnvoi(true);
    try {
      await action();
      notifier(succes);
    } catch (e) {
      setErreur(messageEcriture(e));
    } finally {
      setEnvoi(false);
    }
  };

  const enregistrer = () => executer(() => enregistrerParametres(parametres, p), 'Paramètres enregistrés.');

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lien);
      notifier('Lien copié. Vous pouvez le coller dans le groupe familial.');
    } catch {
      setErreur(`Copie impossible. Lien à partager : ${lien}`);
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Suivi des contributions et dépenses des obsèques de ${parametres.nomDefunt} : ${lien}`)}`;

  const photo = (fichier: File | undefined) => {
    if (!fichier) return;
    void executer(async () => {
      const url = await televerserPhoto(fichier);
      await enregistrerParametres(parametres, { ...parametres, photoUrl: url }, 'Nouvelle photo');
    }, 'Photo mise à jour.');
  };

  const sauvegarde = () =>
    executer(async () => {
      await telechargerSauvegarde();
      await enregistrerParametres(parametres, { ...parametres, derniereSauvegarde: aujourdHui() }, 'Sauvegarde téléchargée');
    }, 'Sauvegarde téléchargée. Conservez ce fichier en lieu sûr.');

  const basculerCloture = () =>
    executer(async () => {
      await enregistrerParametres(parametres, { ...parametres, cloture: !parametres.cloture }, parametres.cloture ? 'Réouverture du suivi' : 'Clôture du suivi');
      setModaleCloture(false);
      setConfirmation('');
    }, parametres.cloture ? 'Le suivi est rouvert.' : 'Le suivi est clôturé. Les comptes sont figés.');

  const baseVide = contributions.length + dons.length + depenses.length === 0;

  return (
    <GabaritAdmin titre="Paramètres" sousTitre="Ce que voit la famille, les catégories, votre compte et la clôture du suivi.">
      {erreur && <MessageErreur>{erreur}</MessageErreur>}

      <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr))]">
        <section className="flex flex-col gap-4 rounded-[22px] bg-white p-6 shadow-flottante">
          <div>
            <h2 className="font-titre text-[22px] font-normal">Espace familial</h2>
            <div className="text-[13px] text-encre-pale">Consultable sans compte, par le lien ci-dessous.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-fond p-2.5 pl-4">
            <span className="min-w-[180px] flex-1 truncate text-sm font-semibold text-encre-douce">{lien}</span>
            <button type="button" onClick={copier} className="min-h-[40px] rounded-[10px] bg-recu px-3.5 text-[13px] font-extrabold text-white">Copier le lien</button>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex min-h-[40px] items-center rounded-[10px] border border-bord bg-white px-3.5 text-[13px] font-bold text-encre no-underline">
              Partager sur WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-or bg-foret-clair text-or">
              {parametres.photoUrl ? <img src={parametres.photoUrl} alt="" className="h-full w-full object-cover" /> : <IconePersonne taille={26} />}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Photo du défunt</span>
              <label className="inline-flex min-h-[36px] cursor-pointer items-center self-start rounded-[10px] border border-bord bg-white px-3 text-[13px] font-bold">
                {parametres.photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => photo(e.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <Champ id="nom" libelle="Nom affiché">
              <input id="nom" className="champ" value={p.nomDefunt} onChange={(e) => maj('nomDefunt', e.target.value)} />
            </Champ>
            <Champ id="dates" libelle="Dates" facultatif>
              <input id="dates" className="champ" placeholder="ex. 1948 – 2026" value={p.dates} onChange={(e) => maj('dates', e.target.value)} />
            </Champ>
          </div>
          <Champ id="citation" libelle="Citation" facultatif>
            <input id="citation" className="champ" value={p.citation} onChange={(e) => maj('citation', e.target.value)} />
          </Champ>
          <Champ id="texte" libelle="Texte d'accueil">
            <textarea id="texte" rows={3} className="champ py-3" value={p.texteAccueil} onChange={(e) => maj('texteAccueil', e.target.value)} />
          </Champ>
          <Champ id="telephone" libelle="Numéro de contact affiché à la famille" facultatif aide="Visible par toute personne qui a le lien de l'espace familial.">
            <input id="telephone" type="tel" className="champ" value={p.telephoneContact} onChange={(e) => maj('telephoneContact', e.target.value)} />
          </Champ>

          <EditeurCeremonies
            ceremonies={p.ceremonies}
            onChange={(v) => maj('ceremonies', v)}
            salutations={p.infoSalutations}
            onSalutations={(v) => maj('infoSalutations', v)}
          />

          <div>
            <Bascule actif={p.afficherNoms} onChange={(v) => maj('afficherNoms', v)} libelle="Afficher le nom des contributeurs" description="Sinon : « Contributeur n° 1 », « n° 2 »…" />
            <Bascule actif={p.afficherMontants} onChange={(v) => maj('afficherMontants', v)} libelle="Afficher le montant de chaque contribution" description="Sinon, seuls les totaux sont visibles" />
            <Bascule actif={p.afficherJustificatifs} onChange={(v) => maj('afficherJustificatifs', v)} libelle="Montrer les justificatifs à la famille" description="Reçus et factures des dépenses" />
          </div>
        </section>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-5 rounded-[22px] bg-white p-6 shadow-flottante">
            <h2 className="font-titre text-[22px] font-normal">Catégories</h2>
            <ListeModifiable titre="Catégories de dépenses" valeurs={p.categoriesDepenses} onChange={(v) => maj('categoriesDepenses', v)} />
            <ListeModifiable titre="Catégories de dons en nature" valeurs={p.categoriesDons} onChange={(v) => maj('categoriesDons', v)} />
            <ListeModifiable titre="Unités de mesure proposées" valeurs={p.unites} onChange={(v) => maj('unites', v)} />
          </section>

          <section className="flex flex-col gap-3.5 rounded-[22px] bg-white p-6 shadow-flottante">
            <h2 className="font-titre text-[22px] font-normal">Compte et sauvegarde</h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col"><span className="text-sm font-bold">{utilisateur?.email}</span><span className="text-xs text-encre-pale">Administrateur</span></div>
              <button
                type="button"
                onClick={() => utilisateur?.email && executer(() => reinitialiser(utilisateur.email!), 'Un e-mail pour changer le mot de passe vous a été envoyé.')}
                className="min-h-[40px] rounded-[10px] border border-bord bg-white px-3.5 text-[13px] font-bold"
              >
                Changer le mot de passe
              </button>
            </div>
            <div className="h-px bg-trait" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-bold">Sauvegarde complète</span>
                <span className="text-xs text-encre-pale">Dernière : {parametres.derniereSauvegarde ? dateCourte(parametres.derniereSauvegarde) : 'jamais'}</span>
              </div>
              <button type="button" disabled={envoi} onClick={sauvegarde} className="min-h-[40px] rounded-[10px] bg-encre px-3.5 text-[13px] font-extrabold text-white disabled:opacity-60">
                Télécharger maintenant
              </button>
            </div>
            {EST_DEMO && (
              <>
                <div className="h-px bg-trait" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Données de démonstration</span>
                    <span className="text-xs text-encre-pale">Espace de test uniquement (collections ame_demo_*)</span>
                  </div>
                  <button
                    type="button"
                    disabled={envoi || !baseVide}
                    onClick={() => executer(chargerDonneesDemo, 'Données fictives chargées : 75 000 reçus, 30 000 payés, 45 000 en caisse.')}
                    className="min-h-[40px] rounded-[10px] bg-or px-3.5 text-[13px] font-extrabold text-[#2A1F05] disabled:opacity-50"
                    title={baseVide ? undefined : 'Déjà chargées'}
                  >
                    {baseVide ? 'Charger les données fictives' : 'Déjà chargées'}
                  </button>
                </div>
              </>
            )}
          </section>

          <section className={classes('flex flex-col gap-3 rounded-[22px] bg-white p-6', parametres.cloture ? 'border-[1.5px] border-encre' : 'border-[1.5px] border-[#E7B9AB]')}>
            <h2 className={classes('font-titre text-[22px] font-normal', !parametres.cloture && 'text-depense-fonce')}>
              {parametres.cloture ? 'Suivi clôturé' : 'Clôturer le suivi'}
            </h2>
            <p className="text-sm leading-relaxed text-encre-douce">
              {parametres.cloture
                ? 'Les comptes sont figés. Vous pouvez rouvrir le suivi si une opération a été oubliée ; la réouverture est inscrite dans l’historique.'
                : 'Une fois toutes les opérations terminées, la clôture fige les comptes : plus aucun ajout ni modification. L’espace familial reste consultable avec le bilan final.'}
            </p>
            <button
              type="button"
              onClick={() => setModaleCloture(true)}
              className={classes('min-h-[46px] self-start rounded-xl px-[18px] text-sm font-extrabold text-white', parametres.cloture ? 'bg-encre' : 'bg-depense')}
            >
              {parametres.cloture ? 'Rouvrir le suivi…' : 'Clôturer le suivi…'}
            </button>
          </section>
        </div>
      </div>

      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl bg-white/95 p-3 shadow-flottante backdrop-blur">
        {modifie && <span className="text-[13px] font-semibold text-attente">Modifications non enregistrées</span>}
        <button type="button" disabled={!modifie} onClick={() => setP(parametres)} className="min-h-[46px] rounded-xl border border-bord px-4 text-sm font-bold disabled:opacity-40">
          Annuler les changements
        </button>
        <button type="button" disabled={!modifie || envoi} onClick={enregistrer} className="min-h-[46px] rounded-xl bg-recu px-5 text-sm font-extrabold text-white disabled:opacity-40">
          {envoi ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>
      </div>

      <Modale ouverte={modaleCloture} onFermer={() => setModaleCloture(false)} titre={parametres.cloture ? 'Rouvrir le suivi' : 'Clôturer le suivi'}>
        <div className="flex flex-col gap-4">
          <h2 className="font-titre text-[22px] font-normal">{parametres.cloture ? 'Rouvrir le suivi ?' : 'Clôturer définitivement le suivi ?'}</h2>
          <p className="text-sm text-encre-douce">
            {parametres.cloture
              ? 'Les ajouts et corrections seront de nouveau possibles.'
              : 'Plus aucun ajout ni aucune correction ne sera possible. Pensez à télécharger une sauvegarde et le rapport final avant.'}
          </p>
          <Champ id="confirmation" libelle={`Tapez ${parametres.cloture ? 'ROUVRIR' : 'CLOTURER'} pour confirmer`}>
            <input id="confirmation" className="champ" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </Champ>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setModaleCloture(false)} className="min-h-[48px] flex-1 rounded-xl border border-bord text-sm font-bold">Retour</button>
            <button
              type="button"
              disabled={confirmation.trim().toUpperCase() !== (parametres.cloture ? 'ROUVRIR' : 'CLOTURER') || envoi}
              onClick={basculerCloture}
              className="min-h-[48px] flex-1 rounded-xl bg-depense text-sm font-extrabold text-white disabled:opacity-40"
            >
              Confirmer
            </button>
          </div>
        </div>
      </Modale>
    </GabaritAdmin>
  );
}
