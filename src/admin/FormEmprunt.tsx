import { useEffect, useState, type FormEvent } from 'react';
import { GabaritAdmin } from './Gabarit';
import { BoutonSuppression, BoutonsEnregistrer, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer, modifier } from '../lib/operations';
import { erreursParChamp, schemaEmprunt } from '../lib/validation';
import { aujourdHui, fcfa, lireMontant, montant } from '../lib/format';
import { MODES_PAIEMENT, STATUTS_EMPRUNT, type Emprunt, type ModePaiement, type StatutEmprunt } from '../types';
import { useNavigate, useParams } from 'react-router-dom';

type Etat = {
  preteur: string;
  montant: string;
  date: string;
  dateRemboursement: string;
  montantRembourse: string;
  statut: StatutEmprunt;
  mode: ModePaiement;
  reference: string;
  commentaire: string;
};

const VIDE: Etat = {
  preteur: '',
  montant: '',
  date: aujourdHui(),
  dateRemboursement: '',
  montantRembourse: '',
  statut: 'annonce',
  mode: 'especes',
  reference: '',
  commentaire: '',
};

export default function FormEmprunt() {
  const { id } = useParams();
  const edition = Boolean(id);
  const { emprunts, parametres, chargement } = useDonnees();
  const existant = emprunts.find((e) => e.id === id);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const [f, setF] = useState<Etat>(VIDE);
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (edition && existant && !initialise) {
      setF({
        preteur: existant.preteur,
        montant: String(existant.montant),
        date: existant.date,
        dateRemboursement: existant.dateRemboursement || '',
        montantRembourse: String(existant.montantRembourse),
        statut: existant.statut,
        mode: existant.mode,
        reference: existant.reference,
        commentaire: existant.commentaire,
      });
      setInitialise(true);
    }
  }, [edition, existant, initialise]);

  const maj = <K extends keyof Etat>(k: K, v: Etat[K]) => setF((x) => ({ ...x, [k]: v }));

  const montantVal = lireMontant(f.montant);
  const rembourseVal = lireMontant(f.montantRembourse);
  const variation = (rembourseVal - (existant ? existant.montantRembourse : 0));
  const fige = edition && existant && (existant.annule || parametres.cloture);

  if (chargement) return <GabaritAdmin titre="Emprunt"><Chargement /></GabaritAdmin>;
  if (edition && !existant) return <GabaritAdmin titre="Emprunt"><MessageErreur>Cet emprunt est introuvable.</MessageErreur></GabaritAdmin>;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const donnees = {
      preteur: f.preteur.trim().replace(/\s+/g, ' '),
      montant: montantVal,
      date: f.date,
      dateRemboursement: f.dateRemboursement || null,
      montantRembourse: rembourseVal,
      statut: f.statut,
      mode: f.mode,
      reference: f.reference.trim(),
      commentaire: f.commentaire.trim(),
    };

    const res = schemaEmprunt.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const libelle = `Emprunt · ${res.data.preteur}`;
      if (edition && existant) {
        await modifier('emprunts', existant.id, existant as unknown as Record<string, unknown>, res.data, libelle, motifCorrection.trim());
        notifier('Emprunt modifié.');
        naviguer('/admin/emprunts');
      } else {
        await creer('emprunts', res.data, libelle);
        notifier(`Emprunt de ${res.data.preteur} enregistré (${fcfa(res.data.montant)}).`);
        if (ajouterAutre) {
          setF({ ...VIDE, date: f.date });
        } else naviguer('/admin/emprunts');
      }
    } catch (e) {
      setErreurGenerale(messageEcriture(e));
    } finally {
      setEnvoi(false);
    }
  };

  const soumettre = (e: FormEvent) => {
    e.preventDefault();
    void enregistrer(false);
  };

  return (
    <GabaritAdmin
      titre={`${edition ? 'Modifier un' : 'Nouvel'} emprunt`}
      sousTitre="Prêt accordé à la famille pour financer les obsèques."
    >
      {fige && <BandeauFige annulee={existant!.annule} motif={existant!.motifAnnulation} />}
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}

            <Champ id="preteur" libelle="Prêteur" erreur={erreurs.preteur}>
              <input
                id="preteur"
                type="text"
                value={f.preteur}
                onChange={(e) => maj('preteur', e.target.value)}
                maxLength={120}
                className="champ"
                placeholder="Nom de la personne ou de l'institution"
                autoFocus
              />
            </Champ>

            <div className="grid gap-5 sm:grid-cols-2">
              <Champ id="montant" libelle="Montant emprunté (FCFA)" erreur={erreurs.montant}>
                <input
                  id="montant"
                  type="number"
                  value={f.montant}
                  onChange={(e) => maj('montant', e.target.value)}
                  className="champ"
                  inputMode="numeric"
                />
              </Champ>

              <Champ id="date" libelle="Date du prêt" erreur={erreurs.date}>
                <input
                  id="date"
                  type="date"
                  value={f.date}
                  onChange={(e) => maj('date', e.target.value)}
                  className="champ"
                />
              </Champ>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Champ id="dateRembours" libelle="Date prévue de remboursement">
                <input
                  id="dateRembours"
                  type="date"
                  value={f.dateRemboursement}
                  onChange={(e) => maj('dateRemboursement', e.target.value)}
                  className="champ"
                />
              </Champ>

              <Champ id="montantRembourse" libelle="Montant remboursé (FCFA)" erreur={erreurs.montantRembourse}>
                <input
                  id="montantRembourse"
                  type="number"
                  value={f.montantRembourse}
                  onChange={(e) => maj('montantRembourse', e.target.value)}
                  className="champ"
                  inputMode="numeric"
                />
              </Champ>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Champ id="statut" libelle="Statut" erreur={erreurs.statut}>
                <select
                  id="statut"
                  value={f.statut}
                  onChange={(e) => maj('statut', e.target.value as StatutEmprunt)}
                  className="champ"
                >
                  {STATUTS_EMPRUNT.map((s) => (
                    <option key={s.valeur} value={s.valeur}>
                      {s.libelle}
                    </option>
                  ))}
                </select>
              </Champ>

              <Champ id="mode" libelle="Mode de paiement" erreur={erreurs.mode}>
                <select
                  id="mode"
                  value={f.mode}
                  onChange={(e) => maj('mode', e.target.value as ModePaiement)}
                  className="champ"
                >
                  {MODES_PAIEMENT.map((m) => (
                    <option key={m.valeur} value={m.valeur}>
                      {m.libelle}
                    </option>
                  ))}
                </select>
              </Champ>
            </div>

            <Champ id="reference" libelle="Référence" erreur={erreurs.reference}>
              <input
                id="reference"
                type="text"
                value={f.reference}
                onChange={(e) => maj('reference', e.target.value)}
                maxLength={120}
                className="champ"
                placeholder="Numéro de transaction, nom, etc."
              />
            </Champ>

            <Champ id="commentaire" libelle="Commentaires" erreur={erreurs.commentaire}>
              <textarea
                id="commentaire"
                value={f.commentaire}
                onChange={(e) => maj('commentaire', e.target.value)}
                maxLength={1000}
                className="champ"
                rows={3}
              />
            </Champ>

            {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}
          </fieldset>

          <BoutonsEnregistrer
            envoi={envoi}
            edition={edition}
            couleur="bg-recu"
            libelle="Enregistrer l'emprunt"
            onAutre={() => void enregistrer(true)}
          />
        </form>

        {edition && existant && (
          <BoutonSuppression
            id={existant.id}
            collection="emprunts"
            libelle={`Emprunt · ${existant.preteur}`}
            donnees={existant as unknown as Record<string, unknown>}
            retour="/admin/emprunts"
            description={<>« {existant.preteur} » · {fcfa(existant.montant)}.</>}
          />
        )}
      </div>
    </GabaritAdmin>
  );
}
