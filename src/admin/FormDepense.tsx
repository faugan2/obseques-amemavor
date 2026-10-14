import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BandeauFige, BoutonAnnulation, BoutonsEnregistrer, EffetCaisse, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, Segments, classes, useNotifier } from '../composants/ui';
import { IconeAppareil, IconeDocument } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { creer, lienJustificatif, modifier, nouvelIdentifiant, televerserJustificatif } from '../lib/operations';
import { erreursParChamp, schemaDepense } from '../lib/validation';
import { aujourdHui, fcfa, lireMontant, montant } from '../lib/format';
import { MODES_PAIEMENT, type Justificatif, type ModePaiement, type StatutDepense } from '../types';

const VIDE = {
  designation: '',
  categorie: '',
  statut: 'payee' as StatutDepense,
  montant: '',
  dejaPaye: '',
  beneficiaire: '',
  mode: 'especes' as ModePaiement,
  date: aujourdHui(),
  reference: '',
  commentaire: '',
};

function ChampMontant({ id, libelle, valeur, onChange, erreur, aide }: { id: string; libelle: string; valeur: string; onChange: (v: string) => void; erreur?: string; aide?: string }) {
  return (
    <Champ id={id} libelle={libelle} erreur={erreur} aide={aide}>
      <div className="relative">
        <input
          id={id}
          inputMode="numeric"
          className={classes('champ min-h-[60px] pr-[72px] text-2xl font-extrabold', erreur && 'champ-erreur')}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur ? `${id}-erreur` : undefined}
        />
        <span className="absolute right-4 top-5 text-sm font-extrabold text-encre-pale">FCFA</span>
      </div>
    </Champ>
  );
}

export default function FormDepense() {
  const { id } = useParams();
  const edition = Boolean(id);
  const { depenses, parametres, chargement } = useDonnees();
  const existante = depenses.find((d) => d.id === id);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const [f, setF] = useState(VIDE);
  const [fichier, setFichier] = useState<File | null>(null);
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (edition && existante && !initialise) {
      setF({
        designation: existante.designation,
        categorie: existante.categorie,
        statut: existante.statut,
        montant: String(existante.montant),
        dejaPaye: String(existante.montantPaye),
        beneficiaire: existante.beneficiaire,
        mode: existante.mode,
        date: existante.date,
        reference: existante.reference,
        commentaire: existante.commentaire,
      });
      setInitialise(true);
    }
  }, [edition, existante, initialise]);

  const maj = <K extends keyof typeof VIDE>(k: K, v: (typeof VIDE)[K]) => setF((x) => ({ ...x, [k]: v }));
  const fige = edition && existante && (existante.annule || parametres.cloture);

  if (chargement) return <GabaritAdmin titre="Dépense"><Chargement /></GabaritAdmin>;
  if (edition && !existante) return <GabaritAdmin titre="Dépense"><MessageErreur>Cette dépense est introuvable.</MessageErreur></GabaritAdmin>;

  const total = lireMontant(f.montant);
  const paye = f.statut === 'payee' ? total : f.statut === 'prevue' ? 0 : lireMontant(f.dejaPaye);
  const payeConnu = Number.isFinite(paye) ? paye : 0;
  const variation = -(payeConnu - (edition && existante ? existante.montantPaye : 0));
  const reste = Number.isFinite(total) ? Math.max(0, total - payeConnu) : 0;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const brut = {
      date: f.date,
      designation: f.designation.trim(),
      categorie: f.categorie,
      montant: total,
      montantPaye: paye,
      statut: f.statut,
      beneficiaire: f.beneficiaire.trim(),
      mode: f.mode,
      reference: f.reference.trim(),
      justificatif: (existante?.justificatif ?? null) as Justificatif | null,
      commentaire: f.commentaire.trim(),
    };
    const res = schemaDepense.safeParse(brut);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const idDepense = existante?.id ?? nouvelIdentifiant('depenses');
      const donnees = { ...res.data };
      if (fichier) donnees.justificatif = await televerserJustificatif(idDepense, fichier);
      const libelle = `Dépense · ${donnees.designation}`;
      if (edition && existante) {
        await modifier('depenses', existante.id, existante as unknown as Record<string, unknown>, donnees, libelle, motifCorrection.trim());
        notifier('Correction de la dépense enregistrée. Le solde a été recalculé.');
        naviguer('/admin');
      } else {
        await creer('depenses', donnees, libelle, idDepense);
        notifier(`Dépense « ${donnees.designation} » enregistrée${donnees.montantPaye ? ` (${fcfa(donnees.montantPaye)} payés)` : ''}.`);
        if (ajouterAutre) {
          setF({ ...VIDE, date: f.date });
          setFichier(null);
        } else naviguer('/admin');
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

  const voirJustificatif = async () => {
    if (!existante?.justificatif) return;
    try {
      window.open(await lienJustificatif(existante.justificatif), '_blank', 'noopener');
    } catch {
      setErreurGenerale("Le justificatif n'a pas pu être ouvert.");
    }
  };

  return (
    <GabaritAdmin titre={edition ? 'Modifier une dépense' : 'Nouvelle dépense'} sousTitre="Seule la somme réellement payée est retirée de la caisse.">
      {fige && <BandeauFige annulee={existante!.annule} motif={existante!.motifAnnulation} />}
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}

            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
              <Champ id="designation" libelle="Désignation" erreur={erreurs.designation}>
                <input id="designation" className={classes('champ', erreurs.designation && 'champ-erreur')} placeholder="ex. Location de 100 chaises" value={f.designation} onChange={(e) => maj('designation', e.target.value)} />
              </Champ>
              <Champ id="categorie" libelle="Catégorie" erreur={erreurs.categorie}>
                <select id="categorie" className={classes('champ px-3', erreurs.categorie && 'champ-erreur')} value={f.categorie} onChange={(e) => maj('categorie', e.target.value)}>
                  <option value="">Choisir…</option>
                  {parametres.categoriesDepenses.map((c) => <option key={c} value={c}>{c}</option>)}
                  {f.categorie && !parametres.categoriesDepenses.includes(f.categorie) && <option value={f.categorie}>{f.categorie}</option>}
                </select>
              </Champ>
            </div>

            <Segments<StatutDepense>
              legende="Où en est le paiement ?"
              valeur={f.statut}
              onChange={(v) => maj('statut', v)}
              options={[
                { valeur: 'prevue', libelle: 'Prévue', aide: 'Rien payé encore', ton: 'attente' },
                { valeur: 'partielle', libelle: 'Partielle', aide: 'Une avance versée', ton: 'attente' },
                { valeur: 'payee', libelle: 'Payée', aide: 'Totalement réglée', ton: 'depense' },
              ]}
            />

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-start gap-3.5">
              <ChampMontant id="montant" libelle={f.statut === 'payee' ? 'Montant payé' : 'Montant total'} valeur={f.montant} onChange={(v) => maj('montant', v)} erreur={erreurs.montant} />
              {f.statut === 'partielle' && (
                <>
                  <ChampMontant id="dejaPaye" libelle="Déjà payé" valeur={f.dejaPaye} onChange={(v) => maj('dejaPaye', v)} erreur={erreurs.montantPaye} />
                  <div className="mt-6 flex min-h-[60px] flex-col justify-center rounded-[14px] bg-attente-pale px-4 py-2">
                    <span className="text-xs font-bold text-attente">Reste à payer</span>
                    <span className="text-[22px] font-extrabold text-attente-fonce">{montant(reste)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <Champ id="beneficiaire" libelle="Bénéficiaire / fournisseur" facultatif>
                <input id="beneficiaire" className="champ" value={f.beneficiaire} onChange={(e) => maj('beneficiaire', e.target.value)} />
              </Champ>
              <Champ id="mode" libelle="Mode de paiement">
                <select id="mode" className="champ px-3" value={f.mode} onChange={(e) => maj('mode', e.target.value as ModePaiement)}>
                  {MODES_PAIEMENT.map((m) => <option key={m.valeur} value={m.valeur}>{m.libelle}</option>)}
                </select>
              </Champ>
              <Champ id="date" libelle="Date" erreur={erreurs.date}>
                <input id="date" type="date" className="champ" value={f.date} onChange={(e) => maj('date', e.target.value)} />
              </Champ>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="etiquette">Justificatif <span className="font-medium text-encre-pale">(facultatif)</span></span>
              {existante?.justificatif && !fichier && (
                <button type="button" onClick={voirJustificatif} className="flex items-center gap-2 self-start rounded-xl bg-fond px-3 py-2 text-sm font-bold text-recu">
                  <IconeDocument taille={16} /> Voir le justificatif actuel ({existante.justificatif.nom})
                </button>
              )}
              <label htmlFor="fichier" className="flex cursor-pointer flex-wrap items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-[#B9BEB4] bg-[#F7F8F5] p-5 hover:border-encre-pale">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white shadow-carte"><IconeAppareil taille={22} /></span>
                <span className="flex flex-col">
                  <span className="text-[15px] font-bold">{fichier ? fichier.name : existante?.justificatif ? 'Remplacer le justificatif' : 'Prendre en photo ou choisir un fichier'}</span>
                  <span className="text-xs text-encre-pale">Reçu, facture… JPG, PNG ou PDF, 10 Mo maximum</span>
                </span>
              </label>
              <input id="fichier" type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
            </div>

            <Champ id="reference" libelle="Référence du justificatif" facultatif>
              <input id="reference" className="champ" placeholder="ex. Facture n° 0123" value={f.reference} onChange={(e) => maj('reference', e.target.value)} />
            </Champ>
            <Champ id="commentaire" libelle="Commentaire" facultatif>
              <textarea id="commentaire" rows={2} className="champ py-3" value={f.commentaire} onChange={(e) => maj('commentaire', e.target.value)} />
            </Champ>

            {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}

            <BoutonsEnregistrer envoi={envoi} edition={edition} couleur="bg-depense" libelle="Enregistrer la dépense" onAutre={() => void enregistrer(true)} />
          </fieldset>
          {edition && existante && !fige && (
            <div className="border-t border-trait pt-4">
              <BoutonAnnulation
                collection="depenses"
                id={existante.id}
                libelle={`Dépense · ${existante.designation}`}
                description={<>« {existante.designation} » · {fcfa(existante.montant)}.</>}
              />
            </div>
          )}
        </form>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <EffetCaisse
            variation={fige ? 0 : variation}
            libelleVariation={edition ? 'Écart avec l’enregistrement actuel' : 'Payé maintenant'}
            reste={{ libelle: 'Ajouté au « reste à payer »', valeur: reste }}
          />
          <section className="rounded-[22px] bg-depense-pale p-5 text-[13px] leading-relaxed text-depense-fonce">
            Si le solde devient négatif, la dépense est quand même enregistrée et un avertissement s'affiche.
          </section>
        </aside>
      </div>
    </GabaritAdmin>
  );
}
