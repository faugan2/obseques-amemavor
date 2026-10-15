import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BoutonSuppression, BoutonsEnregistrer, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer, modifier } from '../lib/operations';
import { erreursParChamp, schemaLibelle } from '../lib/validation';
import { aujourdHui, fcfa } from '../lib/format';
import type { Libelle } from '../types';

type Etat = {
  nom: string;
  description: string;
  ordre: string;
};

const VIDE: Etat = {
  nom: '',
  description: '',
  ordre: '0',
};

export default function FormLibelle() {
  const { id } = useParams();
  const edition = Boolean(id);
  const { libelles, parametres, chargement } = useDonnees();
  const existant = libelles.find((l) => l.id === id);
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
        nom: existant.nom,
        description: existant.description,
        ordre: String(existant.ordre),
      });
      setInitialise(true);
    }
  }, [edition, existant, initialise]);

  const maj = <K extends keyof Etat>(k: K, v: Etat[K]) => setF((x) => ({ ...x, [k]: v }));

  const ordreVal = parseInt(f.ordre) || 0;
  const fige = edition && existant && (existant.annule || parametres.cloture);

  if (chargement) return <GabaritAdmin titre="Libellé"><Chargement /></GabaritAdmin>;
  if (edition && !existant) return <GabaritAdmin titre="Libellé"><MessageErreur>Ce libellé est introuvable.</MessageErreur></GabaritAdmin>;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const donnees = {
      nom: f.nom.trim().replace(/\s+/g, ' '),
      description: f.description.trim(),
      ordre: ordreVal,
    };

    const res = schemaLibelle.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const libelle = `Libellé · ${res.data.nom}`;
      if (edition && existant) {
        await modifier('libelles', existant.id, existant as unknown as Record<string, unknown>, res.data, libelle, motifCorrection.trim());
        notifier('Libellé modifié.');
        naviguer('/admin/libelles');
      } else {
        // Créer le libellé
        const refLibelle = await creer('libelles', res.data, libelle);

        // Créer automatiquement une ligne de budget correspondante
        const budgetData = {
          id_libelle: refLibelle.id,
          responsable: '',
          financement: '',
          prevision: 0,
          montantPaye: 0,
          commentaire: `Créé automatiquement pour le libellé "${res.data.nom}"`,
        };
        await creer('budget', budgetData, `Budget · ${res.data.nom}`);

        notifier(`✅ Libellé « ${res.data.nom} » créé + Ligne de budget ajoutée`);
        if (ajouterAutre) {
          setF({ ...VIDE, ordre: String(ordreVal + 10) });
        } else naviguer('/admin/libelles');
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
      titre={`${edition ? 'Modifier un' : 'Nouveau'} libellé`}
      sousTitre="Libellés utilisés par les postes budgétaires et les dépenses."
    >
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}

            <Champ id="nom" libelle="Nom du libellé" erreur={erreurs.nom}>
              <input
                id="nom"
                type="text"
                value={f.nom}
                onChange={(e) => maj('nom', e.target.value)}
                maxLength={120}
                className="champ"
                placeholder="Ex: Frais morgue, Cercueil, Électricité"
                autoFocus
              />
            </Champ>

            <Champ id="description" libelle="Description (optionnel)" erreur={erreurs.description}>
              <textarea
                id="description"
                value={f.description}
                onChange={(e) => maj('description', e.target.value)}
                maxLength={500}
                className="champ"
                rows={3}
                placeholder="Description détaillée du libellé"
              />
            </Champ>

            <Champ id="ordre" libelle="Ordre d'affichage" erreur={erreurs.ordre}>
              <input
                id="ordre"
                type="number"
                value={f.ordre}
                onChange={(e) => maj('ordre', e.target.value)}
                className="champ"
                inputMode="numeric"
              />
            </Champ>

            {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}
          </fieldset>

          <BoutonsEnregistrer
            envoi={envoi}
            edition={edition}
            couleur="bg-recu"
            libelle="Enregistrer le libellé"
            onAutre={() => void enregistrer(true)}
          />
        </form>

        {edition && existant && (
          <BoutonSuppression
            id={existant.id}
            collection="libelles"
            libelle={`Libellé · ${existant.nom}`}
            donnees={existant as unknown as Record<string, unknown>}
            retour="/admin/libelles"
            description={<>« {existant.nom} ».</>}
          />
        )}
      </div>
    </GabaritAdmin>
  );
}
