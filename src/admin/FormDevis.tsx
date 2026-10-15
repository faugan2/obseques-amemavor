import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BandeauFige, BoutonSuppression, BoutonsEnregistrer, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, Segments, classes, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer, modifier } from '../lib/operations';
import { erreursParChamp, schemaDevis } from '../lib/validation';
import { aujourdHui, fcfa, lireMontant } from '../lib/format';
import type { StatutDevis } from '../types';

const VIDE = {
  prestataire: '',
  posteId: '',
  objet: '',
  montant: '',
  date: aujourdHui(),
  statut: 'recu' as StatutDevis,
  reference: '',
  commentaire: '',
};

/** Création et modification d'un devis de prestataire. */
export default function FormDevis() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const edition = Boolean(id);
  const { devis, libelles, budgetLignes, parametres, chargement } = useDonnees();
  const libellesTries = [...libelles].sort((a, b) => a.nom.localeCompare(b.nom));
  const existant = devis.find((d) => d.id === id);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const [f, setF] = useState({ ...VIDE, posteId: params.get('poste') ?? '' });
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (edition && existant && !initialise) {
      setF({
        prestataire: existant.prestataire,
        posteId: existant.posteId,
        objet: existant.objet,
        montant: String(existant.montant),
        date: existant.date,
        statut: existant.statut,
        reference: existant.reference,
        commentaire: existant.commentaire,
      });
      setInitialise(true);
    }
  }, [edition, existant, initialise]);

  const maj = <K extends keyof typeof VIDE>(k: K, v: (typeof VIDE)[K]) => setF((x) => ({ ...x, [k]: v }));
  const fige = edition && existant && (existant.annule || parametres.cloture);

  if (chargement) return <GabaritAdmin titre="Devis"><Chargement /></GabaritAdmin>;
  if (edition && !existant) return <GabaritAdmin titre="Devis"><MessageErreur>Ce devis est introuvable.</MessageErreur></GabaritAdmin>;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const donnees = {
      prestataire: f.prestataire.trim().replace(/\s+/g, ' '),
      posteId: f.posteId,
      objet: f.objet.trim(),
      montant: lireMontant(f.montant),
      date: f.date,
      statut: f.statut,
      reference: f.reference.trim(),
      commentaire: f.commentaire.trim(),
    };
    const res = schemaDevis.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (!f.posteId) errs.posteId = 'Choisissez le libellé du budget concerné.';
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const libelle = `Devis · ${res.data.prestataire}`;
      if (edition && existant) {
        await modifier('devis', existant.id, existant as unknown as Record<string, unknown>, res.data, libelle, motifCorrection.trim());
        notifier('Devis mis à jour.');
        naviguer('/admin/devis');
      } else {
        await creer('devis', res.data, libelle);
        notifier(`Devis de ${res.data.prestataire} enregistré (${fcfa(res.data.montant)}).`);
        if (ajouterAutre) setF({ ...VIDE, posteId: f.posteId, date: f.date });
        else naviguer('/admin/devis');
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
    <GabaritAdmin titre={edition ? 'Modifier un devis' : 'Nouveau devis prestataire'} sousTitre="Les devis sont visibles par la famille, pour comparer les offres d'un même poste.">
      {fige && <BandeauFige annulee={existant!.annule} motif={existant!.motifAnnulation} />}
      <form onSubmit={soumettre} noValidate className="flex max-w-[760px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
        <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
          {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
            <Champ id="prestataire" libelle="Prestataire" erreur={erreurs.prestataire}>
              <input id="prestataire" className={classes('champ', erreurs.prestataire && 'champ-erreur')} placeholder="ex. Traiteur Délices de Lomé" value={f.prestataire} onChange={(e) => maj('prestataire', e.target.value)} />
            </Champ>
            <Champ id="poste" libelle="Libellé du budget" erreur={erreurs.posteId}>
              <select id="poste" className={classes('champ px-3', erreurs.posteId && 'champ-erreur')} value={f.posteId} onChange={(e) => maj('posteId', e.target.value)}>
                <option value="">Choisir…</option>
                {libellesTries.filter((l) => !l.annule).map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
              </select>
            </Champ>
          </div>
          <Champ id="objet" libelle="Objet du devis" facultatif>
            <input id="objet" className="champ" placeholder="ex. Déjeuner pour 500 personnes, boissons comprises" value={f.objet} onChange={(e) => maj('objet', e.target.value)} />
          </Champ>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            <Champ id="montant" libelle="Montant du devis" erreur={erreurs.montant} aide={budgetLignes.find((bl) => bl.id_libelle === f.posteId)?.prevision ? `Prévu au budget : ${fcfa(budgetLignes.find((bl) => bl.id_libelle === f.posteId)?.prevision || 0)}` : undefined}>
              <div className="relative">
                <input id="montant" inputMode="numeric" className={classes('champ min-h-[60px] pr-[72px] text-2xl font-extrabold', erreurs.montant && 'champ-erreur')} placeholder="0" value={f.montant} onChange={(e) => maj('montant', e.target.value)} />
                <span className="absolute right-4 top-5 text-sm font-extrabold text-encre-pale">FCFA</span>
              </div>
            </Champ>
            <Champ id="date" libelle="Date du devis" erreur={erreurs.date}>
              <input id="date" type="date" className="champ" value={f.date} onChange={(e) => maj('date', e.target.value)} />
            </Champ>
          </div>
          <Segments<StatutDevis>
            legende="Décision"
            valeur={f.statut}
            onChange={(v) => maj('statut', v)}
            options={[
              { valeur: 'recu', libelle: 'À étudier', aide: 'Devis reçu', ton: 'attente' },
              { valeur: 'retenu', libelle: 'Retenu', aide: 'Prestataire choisi', ton: 'recu' },
              { valeur: 'refuse', libelle: 'Non retenu', aide: 'Offre écartée', ton: 'depense' },
            ]}
          />
          <Champ id="reference" libelle="Référence du devis" facultatif>
            <input id="reference" className="champ" placeholder="ex. Devis n° 2026-118" value={f.reference} onChange={(e) => maj('reference', e.target.value)} />
          </Champ>
          <Champ id="commentaire" libelle="Commentaire" facultatif>
            <textarea id="commentaire" rows={2} className="champ py-3" placeholder="ex. Acompte de 50 % à la commande" value={f.commentaire} onChange={(e) => maj('commentaire', e.target.value)} />
          </Champ>
          {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}
          <BoutonsEnregistrer envoi={envoi} edition={edition} couleur="bg-foret" libelle="Enregistrer le devis" onAutre={() => void enregistrer(true)} />
        </fieldset>
        {edition && existant && !fige && (
          <div className="border-t border-trait pt-4">
            <BoutonSuppression
              collection="devis"
              id={existant.id}
              libelle={`Devis · ${existant.prestataire}`}
              donnees={existant as unknown as Record<string, unknown>}
              retour="/admin/devis"
              description={<>Le devis de « {existant.prestataire} » ({fcfa(existant.montant)}).</>}
            />
          </div>
        )}
      </form>
    </GabaritAdmin>
  );
}
