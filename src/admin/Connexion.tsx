import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { messageAuth, useAuth } from '../lib/auth';
import { useDonnees } from '../lib/donnees';
import { BandeauDemo, Chargement, MessageErreur } from '../composants/ui';
import { IconeCadenas } from '../composants/icones';

export default function Connexion() {
  const { utilisateur, estAdmin, chargement, connexion, deconnexion, reinitialiser } = useAuth();
  const { parametres } = useDonnees();
  const lieu = useLocation();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (chargement) return <Chargement texte="Vérification de la connexion…" />;
  if (utilisateur && estAdmin) {
    const destination = (lieu.state as { de?: string } | null)?.de ?? '/admin';
    return <Navigate to={destination} replace />;
  }

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur('');
    setInfo('');
    if (!email.trim() || !motDePasse) {
      setErreur("Saisissez l'adresse e-mail et le mot de passe.");
      return;
    }
    setEnvoi(true);
    try {
      await connexion(email, motDePasse);
    } catch (err) {
      setErreur(messageAuth(err));
    } finally {
      setEnvoi(false);
    }
  };

  const oubli = async () => {
    setErreur('');
    if (!email.trim()) {
      setErreur("Saisissez d'abord votre adresse e-mail, puis cliquez sur « Mot de passe oublié ».");
      return;
    }
    try {
      await reinitialiser(email);
      setInfo('Si cette adresse correspond à un compte, un e-mail de réinitialisation vient d’être envoyé.');
    } catch (err) {
      setErreur(messageAuth(err));
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <BandeauDemo />
      <div className="flex flex-1 flex-wrap">
        <div className="flex flex-[1_1_420px] flex-col justify-between gap-10 bg-foret p-8 text-white sm:p-12">
          <div className="text-sm font-bold">Obsèques · {parametres.nomDefunt}</div>
          <div className="flex max-w-[440px] flex-col gap-3.5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-or">Espace trésorier</div>
            <div className="font-titre text-[36px] leading-[1.08] sm:text-[44px]">Tenir les comptes de la famille, en toute clarté.</div>
            <p className="text-[15px] leading-relaxed text-[#C9D5D0]">
              Seul l'administrateur se connecte ici pour enregistrer les contributions, les dons et les dépenses. La famille consulte
              librement l'espace familial, sans compte.
            </p>
          </div>
          <Link to="/" className="text-sm font-bold text-or-clair no-underline">← Retour à l'espace familial</Link>
        </div>

        <div className="flex flex-[1_1_420px] items-center justify-center px-4 py-12">
          <form onSubmit={soumettre} noValidate className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl bg-white p-8 shadow-flottante sm:p-9">
            <div>
              <h1 className="font-titre text-[30px] font-normal">Connexion</h1>
              <div className="text-sm text-encre-pale">Accès réservé à l'administrateur</div>
            </div>

            {utilisateur && !estAdmin && (
              <MessageErreur>
                Ce compte ({utilisateur.email}) n'a pas les droits d'administration.{' '}
                <button type="button" className="font-bold underline" onClick={() => deconnexion()}>Se déconnecter</button>
              </MessageErreur>
            )}
            {erreur && <MessageErreur>{erreur}</MessageErreur>}
            {info && <div role="status" className="rounded-2xl bg-recu-pale p-4 text-sm text-recu-fonce">{info}</div>}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="etiquette">Adresse e-mail</label>
              <input id="email" type="email" autoComplete="username" className="champ bg-[#F7F8F5]" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mdp" className="etiquette">Mot de passe</label>
              <input id="mdp" type="password" autoComplete="current-password" className="champ bg-[#F7F8F5]" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </div>
            <button type="submit" disabled={envoi} className="min-h-[52px] rounded-[14px] bg-recu text-base font-extrabold text-white disabled:opacity-60">
              {envoi ? 'Connexion…' : 'Se connecter'}
            </button>
            <button type="button" onClick={oubli} className="text-center text-[13px] font-bold text-recu">Mot de passe oublié ?</button>
            <div className="flex items-start gap-2.5 rounded-xl bg-fond p-3.5 text-xs leading-relaxed text-encre-douce">
              <IconeCadenas taille={16} className="mt-0.5 shrink-0" />
              <span>Connexion chiffrée. Après plusieurs essais incorrects, l'accès est bloqué quelques minutes.</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
