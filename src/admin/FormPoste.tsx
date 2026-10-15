import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BandeauFige, BoutonSuppression, BoutonsEnregistrer, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, classes, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { creer, modifier } from '../lib/operations';
import { erreursParChamp, schemaPoste } from '../lib/validation';
import { dateCourte, lireMontant, montant } from '../lib/format';

const VIDE = { libelle: '', prevision: '', responsable: '', financement: '', commentaire: '' };

/** Création et modification d'un poste du budget prévisionnel. */
export default function FormPoste() {
  const { id } = useParams();
  const edition = Boolean(id);
  const { postes, depenses, devis, budget, parametres, libelles, chargement } = useDonnees();
  const existant = postes.find((p) => p.id === id);
  const naviguer = useNavigate();
  const notifier = useNotifier();
  const libellesTries = [...libelles].sort((a, b) => a.ordre - b.ordre || a.nom.localeCompare(b.nom));

  const [f, setF] = useState(VIDE);
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (edition && existant && !initialise) {
      setF({
        libelle: existant.libelle,
        prevision: existant.prevision ? String(existant.prevision) : '',
        responsable: existant.responsable,
        financement: existant.financement,
        commentaire: existant.commentaire,
      });
      setInitialise(true);
    }
  }, [edition, existant, initialise]);

  const maj = <K extends keyof typeof VIDE>(k: K, v: string) => setF((x) => ({ ...x, [k]: v }));
  const fige = edition && existant && (existant.annule || parametres.cloture);
  const ligne = budget.lignes.find((l) => l.poste.id === id);
  const liees = depenses.filter((d) => !d.annule && d.posteId === id);
  const devisLies = devis.filter((d) => !d.annule && d.posteId === id);

  if (chargement) return <GabaritAdmin titre="Poste du budget"><Chargement /></GabaritAdmin>;
  if (edition && !existant) return <GabaritAdmin titre="Poste du budget"><MessageErreur>Ce poste est introuvable.</MessageErreur></GabaritAdmin>;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const ordreMax = Math.max(0, ...postes.map((p) => p.ordre));
    const donnees = {
      libelle: f.libelle.trim().replace(/\s+/g, ' '),
      prevision: f.prevision.trim() === '' ? 0 : lireMontant(f.prevision),
      responsable: f.responsable.trim(),
      financement: f.financement.trim(),
      commentaire: f.commentaire.trim(),
      ordre: existant?.ordre ?? ordreMax + 10,
    };
    const res = schemaPoste.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const libelle = `Poste · ${res.data.libelle}`;
      if (edition && existant) {
        await modifier('postes', existant.id, existant as unknown as Record<string, unknown>, res.data, libelle, motifCorrection.trim());
        notifier('Poste mis à jour.');
        naviguer('/admin/budget');
      } else {
        await creer('postes', res.data, libelle);
        notifier(`Poste « ${res.data.libelle} » ajouté au budget.`);
        if (ajouterAutre) setF(VIDE);
        else naviguer('/admin/budget');
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
    <GabaritAdmin titre={edition ? 'Modifier un poste du budget' : 'Nouveau poste du budget'} sousTitre="Le réalisé est calculé automatiquement à partir des dépenses rattachées au poste.">
      {fige && <BandeauFige annulee={existant!.annule} motif={existant!.motifAnnulation} />}
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}
            <Champ id="libelle" libelle="Libellé du poste" erreur={erreurs.libelle}>
              <select
                id="libelle"
                className={classes('champ px-3', erreurs.libelle && 'champ-erreur')}
                value={f.libelle}
                onChange={(e) => maj('libelle', e.target.value)}
              >
                <option value="">Choisir un libellé…</option>
                {libellesTries.map((l) => <option key={l.id} value={l.nom}>{l.nom}{l.description ? ` · ${l.description}` : ''}</option>)}
              </select>
            </Champ>
            <Champ id="prevision" libelle="Montant prévu" facultatif erreur={erreurs.prevision} aide="Laisser vide si le poste n'est pas encore chiffré.">
              <div className="relative">
                <input id="prevision" inputMode="numeric" className={classes('champ min-h-[60px] pr-[72px] text-2xl font-extrabold', erreurs.prevision && 'champ-erreur')} placeholder="0" value={f.prevision} onChange={(e) => maj('prevision', e.target.value)} />
                <span className="absolute right-4 top-5 text-sm font-extrabold text-encre-pale">FCFA</span>
              </div>
            </Champ>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
              <Champ id="responsable" libelle="Responsable" facultatif>
                <input id="responsable" list="liste-responsables" className="champ" value={f.responsable} onChange={(e) => maj('responsable', e.target.value)} />
                <datalist id="liste-responsables">{parametres.responsables.map((r) => <option key={r} value={r} />)}</datalist>
              </Champ>
              <Champ id="financement" libelle="Financement prévu" facultatif>
                <input id="financement" list="liste-financements" className="champ" value={f.financement} onChange={(e) => maj('financement', e.target.value)} />
                <datalist id="liste-financements">{parametres.sourcesFinancement.map((r) => <option key={r} value={r} />)}</datalist>
              </Champ>
            </div>
            <Champ id="commentaire" libelle="Commentaire" facultatif>
              <textarea id="commentaire" rows={2} className="champ py-3" value={f.commentaire} onChange={(e) => maj('commentaire', e.target.value)} />
            </Champ>
            {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}
            <BoutonsEnregistrer envoi={envoi} edition={edition} couleur="bg-foret" libelle="Enregistrer le poste" onAutre={() => void enregistrer(true)} />
          </fieldset>
          {edition && existant && !fige && (
            <div className="border-t border-trait pt-4">
              <BoutonSuppression
                collection="postes"
                id={existant.id}
                libelle={`Poste · ${existant.libelle}`}
                donnees={existant as unknown as Record<string, unknown>}
                retour="/admin/budget"
                description={<>Le poste « {existant.libelle} ».</>}
                avertissement={
                  liees.length + devisLies.length > 0
                    ? `${liees.length} dépense(s) et ${devisLies.length} devis sont rattachés à ce poste : ils seront conservés et apparaîtront « hors budget ».`
                    : undefined
                }
              />
            </div>
          )}
        </form>

        {edition && ligne && (
          <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <section className="carte flex flex-col gap-3 p-6">
              <h2 className="font-titre text-xl font-normal">Suivi du poste</h2>
              <div className="flex justify-between text-sm"><span>Prévu</span><strong>{montant(ligne.prevision)}</strong></div>
              <div className="flex justify-between text-sm text-attente"><span>Engagé</span><strong>{montant(ligne.engage)}</strong></div>
              <div className="flex justify-between text-sm text-depense"><span>Payé</span><strong>{montant(ligne.realise)}</strong></div>
              <div className="h-px bg-trait" />
              <div className={classes('flex justify-between text-sm font-bold', ligne.ecart < 0 ? 'text-depense-fonce' : 'text-recu')}>
                <span>{ligne.ecart < 0 ? 'Dépassement' : 'Marge restante'}</span>
                <span>{montant(Math.abs(ligne.ecart))}</span>
              </div>
              {liees.length > 0 && (
                <ul className="flex flex-col gap-1.5 text-[13px]">
                  {liees.map((d) => (
                    <li key={d.id}>
                      <Link to={`/admin/depense/${d.id}`} className="flex justify-between gap-2 rounded-lg bg-fond px-3 py-2 text-encre no-underline">
                        <span className="truncate">{d.designation} · {dateCourte(d.date)}</span>
                        <span className="font-bold text-depense">{montant(d.montantPaye)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {!parametres.cloture && (
                <Link to={`/admin/depense/nouvelle?poste=${ligne.poste.id}`} className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] bg-depense px-3 text-[13px] font-extrabold text-white no-underline">
                  + Dépense sur ce poste
                </Link>
              )}
            </section>
          </aside>
        )}
      </div>
    </GabaritAdmin>
  );
}
