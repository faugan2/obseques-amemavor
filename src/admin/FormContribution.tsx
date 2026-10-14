import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GabaritAdmin } from './Gabarit';
import { BandeauFige, BoutonSuppression, BoutonsEnregistrer, EffetCaisse, MotifCorrection, messageEcriture } from './communs';
import { Avatar, Champ, Chargement, MessageErreur, Segments, classes, useNotifier } from '../composants/ui';
import { useDonnees } from '../lib/donnees';
import { cleNom, typeDe } from '../lib/calculs';
import { creer, modifier } from '../lib/operations';
import { erreursParChamp, schemaContribution } from '../lib/validation';
import { aujourdHui, fcfa, lireMontant, montant } from '../lib/format';
import { MODES_PAIEMENT, type ModePaiement, type TypeContribution } from '../types';

type Etat = 'recu' | 'promis';

const VIDE = {
  etat: 'recu' as Etat,
  type: 'participation' as TypeContribution,
  groupe: '',
  contributeur: '',
  montant: '',
  dejaRecu: '',
  mode: 'especes' as ModePaiement,
  date: aujourdHui(),
  reference: '',
  motif: '',
  commentaire: '',
};

export default function FormContribution({ typeInitial = 'participation' }: { typeInitial?: TypeContribution }) {
  const { id } = useParams();
  const edition = Boolean(id);
  const { contributions, parametres, chargement } = useDonnees();
  const existante = contributions.find((c) => c.id === id);
  const naviguer = useNavigate();
  const notifier = useNotifier();

  const [f, setF] = useState({ ...VIDE, type: typeInitial });
  const [motifCorrection, setMotifCorrection] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [suggestionsOuvertes, setSuggestionsOuvertes] = useState(false);
  const [doublonConfirme, setDoublonConfirme] = useState(false);
  const [initialise, setInitialise] = useState(false);

  useEffect(() => {
    if (edition && existante && !initialise) {
      setF({
        etat: existante.montantRecu >= existante.montant ? 'recu' : 'promis',
        type: typeDe(existante),
        groupe: existante.groupe ?? '',
        contributeur: existante.contributeur,
        montant: String(existante.montant),
        dejaRecu: String(existante.montantRecu),
        mode: existante.mode,
        date: existante.date,
        reference: existante.reference,
        motif: existante.motif,
        commentaire: existante.commentaire,
      });
      setInitialise(true);
    }
  }, [edition, existante, initialise]);

  const maj = <K extends keyof typeof VIDE>(k: K, v: (typeof VIDE)[K]) => setF((x) => ({ ...x, [k]: v }));

  // Contributeurs déjà connus (pour éviter de compter deux fois la même personne).
  const connus = useMemo(() => {
    const map = new Map<string, { nom: string; nb: number; total: number }>();
    for (const c of contributions) {
      if (c.annule) continue;
      const e = map.get(c.contributeurCle) ?? { nom: c.contributeur, nb: 0, total: 0 };
      e.nb += 1;
      e.total += c.montantRecu;
      map.set(c.contributeurCle, e);
    }
    return map;
  }, [contributions]);

  const q = cleNom(f.contributeur);
  const suggestions =
    f.contributeur.trim().length >= 2
      ? [...connus.entries()].filter(([cle]) => cle !== q && q.split(' ').every((mot) => cle.includes(mot))).slice(0, 5)
      : [];

  const mt = lireMontant(f.montant);
  const recu = f.etat === 'recu' ? mt : f.dejaRecu.trim() === '' ? 0 : lireMontant(f.dejaRecu);
  const variation = (Number.isFinite(recu) ? recu : 0) - (edition && existante ? existante.montantRecu : 0);

  const doublon =
    !edition &&
    Number.isFinite(mt) &&
    contributions.some((c) => !c.annule && c.contributeurCle === q && c.date === f.date && c.montant === mt);

  const fige = edition && existante && (existante.annule || parametres.cloture);
  const cot = f.type === 'cotisation';
  const retour = cot ? '/admin/cotisations' : '/admin/participations';

  if (chargement) return <GabaritAdmin titre="Contribution"><Chargement /></GabaritAdmin>;
  if (edition && !existante) return <GabaritAdmin titre="Contribution"><MessageErreur>Cette contribution est introuvable.</MessageErreur></GabaritAdmin>;

  const enregistrer = async (ajouterAutre: boolean) => {
    setErreurGenerale('');
    const donnees = {
      type: f.type,
      groupe: f.type === 'cotisation' ? f.groupe : '',
      contributeur: f.contributeur.trim().replace(/\s+/g, ' '),
      contributeurCle: cleNom(f.contributeur),
      date: f.date,
      montant: mt,
      montantRecu: recu,
      mode: f.mode,
      motif: f.motif.trim(),
      reference: f.reference.trim(),
      commentaire: f.commentaire.trim(),
    };
    const res = schemaContribution.safeParse(donnees);
    const errs = res.success ? {} : erreursParChamp(res.error);
    if (edition && motifCorrection.trim().length < 3) errs.motifCorrection = 'Indiquez le motif de la correction.';
    if (f.type === 'cotisation' && !f.groupe) errs.groupe = 'Choisissez le groupe familial.';
    if (doublon && !doublonConfirme) errs.doublon = 'Confirmez qu’il ne s’agit pas d’un doublon.';
    setErreurs(errs);
    if (Object.keys(errs).length > 0 || !res.success) return;

    setEnvoi(true);
    try {
      const libelle = `${cot ? 'Cotisation' : 'Participation'} · ${res.data.contributeur}`;
      if (edition && existante) {
        await modifier('contributions', existante.id, existante as unknown as Record<string, unknown>, res.data, libelle, motifCorrection.trim());
        notifier('Correction enregistrée. Les totaux ont été recalculés.');
        naviguer(retour);
      } else {
        await creer('contributions', res.data, libelle);
        notifier(`${cot ? 'Cotisation' : 'Participation'} de ${res.data.contributeur} enregistrée (${fcfa(res.data.montantRecu)} reçus).`);
        if (ajouterAutre) {
          setF({ ...VIDE, type: f.type, groupe: f.groupe, date: f.date });
          setDoublonConfirme(false);
        } else naviguer(retour);
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
      titre={`${edition ? 'Modifier une' : 'Nouvelle'} ${cot ? 'cotisation' : 'participation en argent'}`}
      sousTitre={cot ? 'Quote-part attendue d’un membre de la famille, et ce qu’il a déjà versé.' : 'Don libre en argent d’un proche ou d’un ami de la famille.'}
    >
      {fige && <BandeauFige annulee={existante!.annule} motif={existante!.motifAnnulation} />}
      <div className="flex flex-wrap items-start gap-5">
        <form onSubmit={soumettre} noValidate className="flex min-w-0 flex-[999_1_520px] flex-col gap-5 rounded-[22px] bg-white p-5 shadow-flottante sm:p-7">
          <fieldset disabled={Boolean(fige)} className="flex flex-col gap-5">
            {erreurGenerale && <MessageErreur>{erreurGenerale}</MessageErreur>}

            <Segments<TypeContribution>
              legende="Type d'entrée"
              valeur={f.type}
              onChange={(v) => maj('type', v)}
              colonnes={2}
              options={[
                { valeur: 'cotisation', libelle: 'Cotisation', aide: 'Quote-part de la famille', ton: 'recu' },
                { valeur: 'participation', libelle: 'Participation', aide: 'Don libre d’un proche', ton: 'recu' },
              ]}
            />

            {cot && (
              <Champ id="groupe" libelle="Groupe familial" erreur={erreurs.groupe}>
                <select id="groupe" className={classes('champ px-3', erreurs.groupe && 'champ-erreur')} value={f.groupe} onChange={(e) => maj('groupe', e.target.value)}>
                  <option value="">Choisir…</option>
                  {parametres.groupesCotisation.map((g) => <option key={g} value={g}>{g}</option>)}
                  {f.groupe && !parametres.groupesCotisation.includes(f.groupe) && <option value={f.groupe}>{f.groupe}</option>}
                </select>
              </Champ>
            )}

            <Segments<Etat>
              legende={cot ? 'La quote-part est-elle versée ?' : 'Cet argent est-il déjà reçu ?'}
              valeur={f.etat}
              onChange={(v) => maj('etat', v)}
              colonnes={2}
              options={[
                { valeur: 'recu', libelle: cot ? 'Versée en totalité' : 'Reçu', aide: 'Entre dans la caisse', ton: 'recu' },
                { valeur: 'promis', libelle: cot ? 'Pas encore, ou en partie' : 'Annoncé', aide: 'Le reste est suivi à part', ton: 'attente' },
              ]}
            />

            <div className="relative">
              <Champ id="contributeur" libelle={cot ? "Nom et prénom du membre de la famille" : "Nom et prénom du participant"} erreur={erreurs.contributeur} aide="Choisir un nom existant évite de compter la même personne deux fois.">
                <input
                  id="contributeur"
                  autoComplete="off"
                  className={classes('champ', erreurs.contributeur && 'champ-erreur')}
                  value={f.contributeur}
                  onChange={(e) => {
                    maj('contributeur', e.target.value);
                    setSuggestionsOuvertes(true);
                  }}
                  onBlur={() => setTimeout(() => setSuggestionsOuvertes(false), 150)}
                />
              </Champ>
              {suggestionsOuvertes && suggestions.length > 0 && (
                <ul className="absolute inset-x-0 top-[78px] z-10 overflow-hidden rounded-xl border border-[#D8DBD3] bg-white shadow-flottante">
                  {suggestions.map(([cle, s]) => (
                    <li key={cle}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          maj('contributeur', s.nom);
                          setSuggestionsOuvertes(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-fond"
                      >
                        <Avatar nom={s.nom} taille={32} />
                        <span className="flex flex-col">
                          <span className="text-sm font-bold">{s.nom}</span>
                          <span className="text-xs text-encre-pale">Déjà {s.nb} contribution{s.nb > 1 ? 's' : ''} · {montant(s.total)} FCFA</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <Champ id="montant" libelle={cot ? 'Quote-part (montant attendu)' : f.etat === 'recu' ? 'Montant reçu' : 'Montant annoncé'} erreur={erreurs.montant}>
                <div className="relative">
                  <input
                    id="montant"
                    inputMode="numeric"
                    className={classes('champ min-h-[64px] pr-20 text-[26px] font-extrabold', erreurs.montant && 'champ-erreur')}
                    value={f.montant}
                    onChange={(e) => maj('montant', e.target.value)}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-[21px] text-[15px] font-extrabold text-encre-pale">FCFA</span>
                </div>
              </Champ>
              {f.etat === 'promis' && (
                <Champ id="dejaRecu" libelle={cot ? "Déjà versé" : "Déjà reçu"} erreur={erreurs.montantRecu} aide="Laisser vide si rien n'a encore été versé.">
                  <div className="relative">
                    <input
                      id="dejaRecu"
                      inputMode="numeric"
                      className={classes('champ min-h-[64px] pr-20 text-[22px] font-extrabold', erreurs.montantRecu && 'champ-erreur')}
                      value={f.dejaRecu}
                      onChange={(e) => maj('dejaRecu', e.target.value)}
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-[21px] text-[15px] font-extrabold text-encre-pale">FCFA</span>
                  </div>
                </Champ>
              )}
            </div>

            <fieldset>
              <legend className="etiquette mb-2">Mode de contribution</legend>
              <div className="flex flex-wrap gap-2">
                {MODES_PAIEMENT.map((m) => (
                  <button
                    key={m.valeur}
                    type="button"
                    aria-pressed={f.mode === m.valeur}
                    onClick={() => maj('mode', m.valeur)}
                    className={classes('min-h-[44px] rounded-full px-4 text-sm', f.mode === m.valeur ? 'bg-encre font-bold text-white' : 'border border-bord bg-white font-semibold')}
                  >
                    {m.libelle}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <Champ id="date" libelle="Date de réception" erreur={erreurs.date}>
                <input id="date" type="date" className="champ" value={f.date} onChange={(e) => maj('date', e.target.value)} />
              </Champ>
              <Champ id="reference" libelle="Référence de transaction" facultatif>
                <input id="reference" className="champ" value={f.reference} onChange={(e) => maj('reference', e.target.value)} />
              </Champ>
            </div>
            <Champ id="motif" libelle="Motif" facultatif>
              <input id="motif" className="champ" placeholder="ex. Participation de l’association du quartier…" value={f.motif} onChange={(e) => maj('motif', e.target.value)} />
            </Champ>
            <Champ id="commentaire" libelle="Commentaire" facultatif>
              <textarea id="commentaire" rows={2} className="champ py-3" value={f.commentaire} onChange={(e) => maj('commentaire', e.target.value)} />
            </Champ>

            {doublon && (
              <div className="rounded-2xl border border-[#EED9A4] bg-attente-pale p-4 text-sm text-attente-fonce">
                <strong>Attention :</strong> une contribution de même montant, même date et même personne existe déjà.
                <label className="mt-2 flex items-center gap-2 font-semibold">
                  <input type="checkbox" checked={doublonConfirme} onChange={(e) => setDoublonConfirme(e.target.checked)} className="h-4 w-4 accent-recu" />
                  Je confirme qu'il s'agit d'une deuxième contribution, pas d'un doublon.
                </label>
                {erreurs.doublon && <div className="mt-1 text-[#B3261E]">{erreurs.doublon}</div>}
              </div>
            )}

            {edition && <MotifCorrection valeur={motifCorrection} onChange={setMotifCorrection} erreur={erreurs.motifCorrection} />}

            <BoutonsEnregistrer envoi={envoi} edition={edition} couleur="bg-recu" libelle="Enregistrer" onAutre={() => void enregistrer(true)} />
          </fieldset>
          {edition && existante && !fige && (
            <div className="border-t border-trait pt-4">
              <BoutonSuppression
                collection="contributions"
                id={existante.id}
                libelle={`${cot ? 'Cotisation' : 'Participation'} · ${existante.contributeur}`}
                donnees={existante as unknown as Record<string, unknown>}
                retour={retour}
                description={<>{cot ? 'La cotisation' : 'La participation'} de « {existante.contributeur} » ({fcfa(existante.montantRecu)} reçus).</>}
              />
            </div>
          )}
        </form>

        <aside className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
          <EffetCaisse
            variation={fige ? 0 : variation}
            libelleVariation={edition ? 'Écart avec l’enregistrement actuel' : 'Cette contribution'}
            reste={f.etat === 'promis' && Number.isFinite(mt) && Number.isFinite(recu) ? { libelle: 'Promesse restant à recevoir', valeur: mt - recu } : undefined}
          />
          <section className="rounded-[22px] bg-recu-pale p-5 text-[13px] leading-relaxed text-recu-fonce">
            La personne qui enregistre, la date et l'heure sont ajoutées automatiquement. Toute correction reste visible dans l'historique.
          </section>
        </aside>
      </div>
    </GabaritAdmin>
  );
}
