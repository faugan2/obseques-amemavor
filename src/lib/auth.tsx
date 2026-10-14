// Authentification de l'administrateur (syntaxe v8).
// Un utilisateur est administrateur si un document ame_admins/{uid} existe.
// Ce document est créé à la main dans la console Firebase (voir README).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type firebase from 'firebase/compat/app';
import { auth, db } from './firebase';
import { COLLECTION_ADMINS } from './espace';

interface EtatAuth {
  utilisateur: firebase.User | null;
  estAdmin: boolean;
  chargement: boolean;
  connexion: (email: string, motDePasse: string) => Promise<void>;
  deconnexion: () => Promise<void>;
  reinitialiser: (email: string) => Promise<void>;
}

const Contexte = createContext<EtatAuth | null>(null);

export function messageAuth(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return "L'adresse e-mail n'est pas valide.";
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Adresse e-mail ou mot de passe incorrect.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    case 'auth/network-request-failed':
      return 'Connexion impossible. Vérifiez votre accès à Internet.';
    default:
      return 'La connexion a échoué. Réessayez.';
  }
}

export function FournisseurAuth({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<firebase.User | null>(null);
  const [estAdmin, setEstAdmin] = useState(false);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    return auth.onAuthStateChanged(async (u) => {
      setChargement(true);
      setUtilisateur(u);
      if (!u) {
        setEstAdmin(false);
        setChargement(false);
        return;
      }
      try {
        const doc = await db.collection(COLLECTION_ADMINS).doc(u.uid).get();
        setEstAdmin(doc.exists);
      } catch {
        setEstAdmin(false);
      }
      setChargement(false);
    });
  }, []);

  const valeur: EtatAuth = {
    utilisateur,
    estAdmin,
    chargement,
    connexion: async (email, motDePasse) => {
      await auth.signInWithEmailAndPassword(email.trim(), motDePasse);
    },
    deconnexion: () => auth.signOut(),
    reinitialiser: (email) => auth.sendPasswordResetEmail(email.trim()),
  };

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): EtatAuth {
  const v = useContext(Contexte);
  if (!v) throw new Error('useAuth doit être utilisé dans <FournisseurAuth>');
  return v;
}
