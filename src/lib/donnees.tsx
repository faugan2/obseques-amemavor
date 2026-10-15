// Lecture des données en temps réel (onSnapshot, syntaxe v8).
// Les totaux sont recalculés automatiquement à chaque changement.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from './firebase';
import { DOC_PARAMETRES, nomCollection } from './espace';
import { budget, derniereMiseAJour, synthese, type Budget, type Synthese } from './calculs';
import { PARAMETRES_PAR_DEFAUT, type Contribution, type Depense, type Devis, type Don, type Emprunt, type Libelle, type Parametres, type Poste } from '../types';

interface EtatDonnees {
  contributions: Contribution[];
  dons: Don[];
  depenses: Depense[];
  postes: Poste[];
  devis: Devis[];
  emprunts: Emprunt[];
  libelles: Libelle[];
  parametres: Parametres;
  parametresExistent: boolean;
  synthese: Synthese;
  budget: Budget;
  derniereMaj: number;
  chargement: boolean;
  erreur: string | null;
}

const Contexte = createContext<EtatDonnees | null>(null);

function messageErreur(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code === 'permission-denied') return "Accès refusé à la base de données. Vérifiez les règles de sécurité Firebase.";
  if (code === 'unavailable') return 'Connexion impossible. Vérifiez votre accès à Internet.';
  return 'Les données n’ont pas pu être chargées. Réessayez dans un instant.';
}

export function FournisseurDonnees({ children }: { children: ReactNode }) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [dons, setDons] = useState<Don[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [postes, setPostes] = useState<Poste[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [libelles, setLibelles] = useState<Libelle[]>([]);
  const [parametres, setParametres] = useState<Parametres>(PARAMETRES_PAR_DEFAUT);
  const [parametresExistent, setParametresExistent] = useState(false);
  const [charges, setCharges] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const fini = () => setCharges((n) => n + 1);
    const surErreur = (e: unknown) => {
      console.error(e);
      setErreur(messageErreur(e));
      fini();
    };

    const ecouter = <T,>(nom: 'contributions' | 'dons' | 'depenses' | 'postes' | 'devis' | 'emprunts' | 'libelles', poser: (l: T[]) => void) => {
      let premier = true;
      const estOrdre = nom === 'postes' || nom === 'libelles';
      const champTri = estOrdre ? 'ordre' : 'date';
      const sensTri = estOrdre ? 'asc' : 'desc';

      console.log(`📂 Chargement de ${nom} depuis ${nomCollection(nom)}...`);

      return db
        .collection(nomCollection(nom))
        .orderBy(champTri, sensTri)
        .onSnapshot((snap) => {
          const donnees = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
          console.log(`✅ ${nom}: ${donnees.length} éléments chargés`);
          poser(donnees);
          if (premier) {
            premier = false;
            fini();
          }
        }, surErreur);
    };

    const arrets = [
      ecouter<Contribution>('contributions', setContributions),
      ecouter<Don>('dons', setDons),
      ecouter<Depense>('depenses', setDepenses),
      ecouter<Poste>('postes', setPostes),
      ecouter<Devis>('devis', setDevis),
      ecouter<Emprunt>('emprunts', setEmprunts),
      ecouter<Libelle>('libelles', setLibelles),
    ];

    let premierParam = true;
    arrets.push(
      db
        .collection(nomCollection('parametres'))
        .doc(DOC_PARAMETRES)
        .onSnapshot((snap) => {
          setParametresExistent(snap.exists);
          setParametres({ ...PARAMETRES_PAR_DEFAUT, ...(snap.data() as Partial<Parametres> | undefined) });
          if (premierParam) {
            premierParam = false;
            fini();
          }
        }, surErreur),
    );

    return () => arrets.forEach((a) => a());
  }, []);

  const valeur = useMemo<EtatDonnees>(
    () => ({
      contributions,
      dons,
      depenses,
      postes,
      devis,
      emprunts,
      libelles,
      parametres,
      parametresExistent,
      synthese: synthese(contributions, dons, depenses, emprunts),
      budget: budget(postes, depenses, devis),
      derniereMaj: derniereMiseAJour([contributions, dons, depenses, postes, devis, emprunts, libelles]),
      chargement: charges < 8,
      erreur,
    }),
    [contributions, dons, depenses, postes, devis, emprunts, libelles, parametres, parametresExistent, charges, erreur],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDonnees(): EtatDonnees {
  const v = useContext(Contexte);
  if (!v) throw new Error('useDonnees doit être utilisé dans <FournisseurDonnees>');
  return v;
}
