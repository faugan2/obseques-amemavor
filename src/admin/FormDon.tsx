import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BandeauFige, BoutonAnnulation, BoutonsEnregistrer, MotifCorrection, messageEcriture } from './communs';
import { Champ, Chargement, MessageErreur, Segments, classes, useNotifier } from '../composants/ui';
import { IconeCategorie } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { cleNom } from '../lib/calculs';
import { creer, modifier } from '../lib/operations';
import { erreursParChamp, schemaDon } from '../lib/validation';
import { aujourdHui, dateLongue, lireMontant } from '../lib/format';
import { STATUTS_DON, type StatutDon } from '../types';

const VIDE = {
  donateur: '',
  categorie: '',
  nature: '',
  quantite: '',
  unite: 'cartons',
  date: aujourdHui(),
  statut: 'recu' as StatutDon,
  valeurEstimee: '',
  observations: '',
};

export default function FormDon() {
  const { id } = useParams();
  const edition = Boolean(id);
  const { dons, parametres, chargement } = useDonnees();
  const existant = dons.find((d) => d.id === id);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const [f, setF] = useState(VIDE);
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (edition && existant && !initialise) {
      setF({
        donateur: existant.donateur,
        categorie: existant.categorie,
        nature: existant.nature,
        quantite: String(existant.quantite),
        unite: existant.unite,
        date: existant.date,
        statut: existant.statut,
        valeurEstimee: existant.valeurEstimee == null ? '' : String(existant.valeurEstimee),
        observations: existant.observations,
      });
      setInitialise(true);
    }
  }, [edition, existant, initialise]);

  const maj = <K extends keyof typeof VIDE>(k: K, v: (typeof VIDE)[K]) => setF((x) => ({ ...x, [k]: v }));
  const fige = edition && existant && (existant.annule || parametres.cloture);

  if (chargement) return <GabaritAdmin titre="Don en nature"><Chargement /></GabaritAdmin>;
  if (edition && !existant) return <GabaritAdmin titre="Don en nature"><MessageErreur>Ce don est introuvable.</MessageErreur></GabaritAdmin>;

  const quantite = Number(f.quantite.replace(',', '.'));

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const donnees = {
      donateur: f.donateur.trim().replace(/\s+/g, ' '),
      donateurCle: cleNom(f.donateur),
      date: f.date,
      categorie: f.categorie,
      nature: f.nature.trim(),
      quantite: f.quantite.trim() === '' ? NaN : quantite,
      unite: f.unite.trim(),
      statut: f.statut,
      valeurEstimee: f.valeurEstimee.trim() === '' ? null : lireMontant(f.valeurEstimee),
      observations: f.observations.trim(),
    };
    const res = schemaDon.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const libelle = `Don · ${res.data.donateur}`;
      if (edition && existant) {
        await modifier('dons', existant.id, existant as unknown as Record<string, unknown>, res.data, libelle, motifCorrection.trim());
        notifier('Correction du don enregistrée.');
        naviguer('/admin');
      } else {
        await creer('dons', res.data, libelle);
        notifier(`Don enregistré : ${res.data.quantite} ${res.data.unite} de ${res.data.nature}.`);
        if (ajouterAutre) setF({ ...VIDE, donateur: f.donateur, date: f.date });
        else naviguer('/admin');
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
    <GabaritAdmin titre={edition ? 'Modifier un don en nature' : 'Nouveau don en nature'} sousTitre="Un bien ou un service offert : boissons, sacs de riz, chaises, transport…">
      {fige && <BandeauFige annulee={existant!.annule} motif={existant!.motifAnnulation} />}
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}

            <Champ id="donateur" libelle="Nom et prénom du donateur" erreur={erreurs.donateur}>
              <input id="donateur" className={classes('champ', erreurs.donateur && 'champ-erreur')} value={f.donateur} onChange={(e) => maj('donateur', e.target.value)} />
            </Champ>

            <fieldset>
              <legend className="etiquette mb-2">Catégorie</legend>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
                {parametres.categoriesDons.map((c) => {
                  const actif = f.categorie === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => maj('categorie', c)}
                      className={classes(
                        'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[14px] text-[13px]',
                        actif ? 'border-2 border-nature bg-nature-pale font-extrabold text-nature-fonce' : 'border border-bord bg-white font-semibold',
                      )}
                    >
                      <IconeCategorie categorie={c} taille={22} strokeWidth={1.8} />
                      {c}
                    </button>
                  );
                })}
              </div>
              {erreurs.categorie && <div className="mt-1.5 text-[13px] text-[#B3261E]">{erreurs.categorie}</div>}
            </fieldset>

            <Champ id="nature" libelle="Nature du bien ou du service" erreur={erreurs.nature}>
              <input id="nature" className={classes('champ', erreurs.nature && 'champ-erreur')} placeholder="ex. Boissons sucrées assorties" value={f.nature} onChange={(e) => maj('nature', e.target.value)} />
            </Champ>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5">
              <Champ id="quantite" libelle="Quantité" erreur={erreurs.quantite}>
                <input id="quantite" inputMode="decimal" className={classes('champ text-xl font-extrabold', erreurs.quantite && 'champ-erreur')} value={f.quantite} onChange={(e) => maj('quantite', e.target.value)} />
              </Champ>
              <Champ id="unite" libelle="Unité" erreur={erreurs.unite}>
                <input id="unite" list="unites" className="champ" value={f.unite} onChange={(e) => maj('unite', e.target.value)} />
                <datalist id="unites">{parametres.unites.map((u) => <option key={u} value={u} />)}</datalist>
              </Champ>
              <Champ id="date" libelle="Date de réception" erreur={erreurs.date}>
                <input id="date" type="date" className="champ" value={f.date} onChange={(e) => maj('date', e.target.value)} />
              </Champ>
            </div>

            <Segments<StatutDon>
              legende="État de réception"
              valeur={f.statut}
              onChange={(v) => maj('statut', v)}
              options={STATUTS_DON.map((s) => ({ valeur: s.valeur, libelle: s.libelle, ton: s.valeur === 'recu' ? 'recu' : 'attente' }))}
            />

            <div className="rounded-[14px] border border-dashed border-[#C9CDC4] bg-[#F7F8F5] p-4">
              <Champ id="valeur" libelle="Valeur estimée" facultatif erreur={erreurs.valeurEstimee} aide="Affichée comme « estimation ». N'est jamais ajoutée au solde de la caisse.">
                <input id="valeur" inputMode="numeric" className="champ" placeholder="ex. 60 000" value={f.valeurEstimee} onChange={(e) => maj('valeurEstimee', e.target.value)} />
              </Champ>
            </div>

            <Champ id="observations" libelle="Observations" facultatif>
              <textarea id="observations" rows={2} className="champ py-3" value={f.observations} onChange={(e) => maj('observations', e.target.value)} />
            </Champ>

            {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}

            <BoutonsEnregistrer envoi={envoi} edition={edition} couleur="bg-nature" libelle="Enregistrer le don" onAutre={() => void enregistrer(true)} />
          </fieldset>
          {edition && existant && !fige && (
            <div className="border-t border-trait pt-4">
              <BoutonAnnulation
                collection="dons"
                id={existant.id}
                libelle={`Don · ${existant.donateur}`}
                description={<>Don de « {existant.donateur} » : {existant.quantite} {existant.unite} de {existant.nature}.</>}
              />
            </div>
          )}
        </form>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <section className="carte flex flex-col gap-3 p-6">
            <h2 className="font-titre text-xl font-normal">Aperçu pour la famille</h2>
            <div className="flex flex-col gap-1 rounded-2xl bg-nature-pale p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-nature">{f.categorie || 'Catégorie'}</div>
              <div className="text-2xl font-extrabold">{f.quantite || '0'} <span className="text-base">{f.unite}</span></div>
              <div className="text-[13px] text-encre-douce">{f.nature || 'Nature du bien'}</div>
              <div className="text-[13px] text-encre-douce">{f.donateur || 'Donateur'} · {dateLongue(f.date)}</div>
            </div>
          </section>
          <section className="rounded-[22px] bg-nature-pale p-5 text-[13px] leading-relaxed text-nature-fonce">
            Les dons en nature sont listés à part. Ils ne modifient pas le solde en caisse.
          </section>
        </aside>
      </div>
    </GabaritAdmin>
  );
}
