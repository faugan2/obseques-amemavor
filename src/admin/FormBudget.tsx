import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BoutonSuppression, BoutonsEnregistrer, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { modifier } from '../lib/operations';
import { erreursParChamp, schemaBudgetLigne } from '../lib/validation';
import { montant } from '../lib/format';
import type { BudgetLigne } from '../types';

type Etat = {
  prevision: string;
  montantPaye: string;
  responsable: string;
  financement: string;
  commentaire: string;
};

const VIDE: Etat = {
  prevision: '0',
  montantPaye: '0',
  responsable: '',
  financement: '',
  commentaire: '',
};

export default function FormBudget() {
  const { id } = useParams();
  const { budgetLignes, libelles, parametres, chargement } = useDonnees();
  const existant = budgetLignes.find((bl) => bl.id === id);
  const libelle = libelles.find((l) => l.id === existant?.id_libelle);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const [f, setF] = useState<Etat>(VIDE);
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (existant && !initialise) {
      setF({
        prevision: String(existant.prevision),
        montantPaye: String(existant.montantPaye),
        responsable: existant.responsable,
        financement: existant.financement,
        commentaire: existant.commentaire,
      });
      setInitialise(true);
    }
  }, [existant, initialise]);

  const maj = <K extends keyof Etat>(k: K, v: Etat[K]) => setF((x) => ({ ...x, [k]: v }));

  const prevision = parseInt(f.prevision) || 0;
  const montantPaye = parseInt(f.montantPaye) || 0;
  const reste = Math.max(0, prevision - montantPaye);
  const fige = existant && (existant.annule || parametres.cloture);

  if (chargement) return <GabaritAdmin titre="Ligne de budget"><Chargement /></GabaritAdmin>;
  if (!existant) return <GabaritAdmin titre="Ligne de budget"><MessageErreur>Cette ligne de budget est introuvable.</MessageErreur></GabaritAdmin>;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const donnees = {
      id_libelle: existant.id_libelle,
      responsable: f.responsable.trim(),
      financement: f.financement.trim(),
      prevision,
      montantPaye,
      commentaire: f.commentaire.trim(),
    };

    const res = schemaBudgetLigne.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      await modifier('budget', existant.id, existant as unknown as Record<string, unknown>, res.data, `Budget · ${libelle?.nom}`, motifCorrection.trim());
      notifier('Ligne de budget modifiée.');
      naviguer('/admin/budget');
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
      titre={`Budget · ${libelle?.nom || 'Libellé'}`}
      sousTitre="Montants prévus et réalisés"
    >
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}

            <div className="rounded-[14px] bg-fond p-4">
              <div className="text-xs font-bold text-encre-pale">Libellé</div>
              <div className="mt-2 text-lg font-extrabold">{libelle?.nom}</div>
            </div>

            <Champ id="prevision" libelle="Montant prévu (FCFA)" erreur={erreurs.prevision}>
              <input
                id="prevision"
                type="number"
                value={f.prevision}
                onChange={(e) => maj('prevision', e.target.value)}
                className="champ"
                inputMode="numeric"
                min="0"
              />
            </Champ>

            <Champ id="montantPaye" libelle="Montant payé (FCFA)" erreur={erreurs.montantPaye}>
              <input
                id="montantPaye"
                type="number"
                value={f.montantPaye}
                onChange={(e) => maj('montantPaye', e.target.value)}
                className="champ"
                inputMode="numeric"
                min="0"
              />
            </Champ>

            <div className="rounded-[14px] bg-recu-pale p-4">
              <div className="text-xs font-bold text-encre-pale">Reste à payer</div>
              <div className="mt-2 text-2xl font-extrabold text-recu">{montant(reste)}</div>
            </div>

            <Champ id="responsable" libelle="Responsable" erreur={erreurs.responsable}>
              <select
                id="responsable"
                value={f.responsable}
                onChange={(e) => maj('responsable', e.target.value)}
                className="champ"
              >
                <option value="">-- Choisir un responsable --</option>
                {parametres.responsables.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Champ>

            <Champ id="financement" libelle="Financement" erreur={erreurs.financement}>
              <select
                id="financement"
                value={f.financement}
                onChange={(e) => maj('financement', e.target.value)}
                className="champ"
              >
                <option value="">-- Choisir une source de financement --</option>
                {parametres.sourcesFinancement.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Champ>

            <Champ id="commentaire" libelle="Commentaire (optionnel)" erreur={erreurs.commentaire}>
              <textarea
                id="commentaire"
                value={f.commentaire}
                onChange={(e) => maj('commentaire', e.target.value)}
                maxLength={1000}
                className="champ"
                rows={3}
                placeholder="Notes sur ce libellé"
              />
            </Champ>

            <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />
          </fieldset>

          <BoutonsEnregistrer
            envoi={envoi}
            edition={true}
            couleur="bg-recu"
            libelle="Enregistrer"
          />
        </form>

        {existant && (
          <BoutonSuppression
            id={existant.id}
            collection="budget"
            libelle={`Budget · ${libelle?.nom}`}
            donnees={existant as unknown as Record<string, unknown>}
            retour="/admin/budget"
            description={<>« {libelle?.nom} »</>}
          />
        )}
      </div>
    </GabaritAdmin>
  );
}
