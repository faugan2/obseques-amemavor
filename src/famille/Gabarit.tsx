import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Chargement, MessageErreur, classes } from '../composants/ui';
import { IconeBudget, IconeCoeur, IconeColombe, IconeDocument, IconeFlecheBas, IconeMaison, IconePersonnes, IconePièce } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { dateHeure, lienTelephone } from '../lib/format';

const LIENS = [
  { vers: '/', libelle: 'Accueil', icone: IconeMaison },
  { vers: '/budget', libelle: 'Budget', icone: IconeBudget },
  { vers: '/depenses', libelle: 'Dépenses', icone: IconeFlecheBas },
  { vers: '/cotisations', libelle: 'Cotisations', court: 'Cotisat.', icone: IconePersonnes },
  { vers: '/participations', libelle: 'Participations', court: 'Particip.', icone: IconeCoeur },
  { vers: '/emprunts', libelle: 'Emprunts', icone: IconePièce },
  { vers: '/devis', libelle: 'Devis prestataires', court: 'Devis', icone: IconeDocument },
];

function Embleme() {
  return (
    <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-or text-or-clair">
      <IconeColombe taille={24} />
    </div>
  );
}

/** Mise en page commune à l'espace familial : bandeau sombre, menu, contenu, pied de page. */
export function GabaritFamille({
  titre,
  sousTitre,
  entete,
  children,
}: {
  titre?: string;
  sousTitre?: string;
  entete?: ReactNode;
  children: ReactNode;
}) {
  const { parametres, chargement, erreur, derniereMaj } = useDonnees();

  return (
    <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
      <div className="bg-foret text-white">
        <div className="conteneur flex flex-wrap items-center justify-between gap-3 py-4">
          <Link to="/" className="flex items-center gap-2.5 text-white no-underline">
            <Embleme />
            <span className="text-sm font-bold">Obsèques · {parametres.nomDefunt}</span>
          </Link>
          <nav aria-label="Rubriques" className="hidden flex-wrap gap-1 lg:flex">
            {LIENS.map((l) => (
              <NavLink
                key={l.vers}
                to={l.vers}
                end
                className={({ isActive }) =>
                  classes(
                    'flex min-h-[40px] items-center rounded-full px-3.5 text-sm no-underline transition',
                    isActive ? 'bg-white font-bold text-foret' : 'font-semibold text-[#D9E3DF] hover:bg-white/10',
                  )
                }
              >
                {l.libelle}
              </NavLink>
            ))}
          </nav>
        </div>
        {entete ?? (
          <div className="conteneur flex flex-col gap-1.5 pb-[72px] pt-6">
            <h1 className="font-titre text-[34px] font-normal leading-tight sm:text-[38px]">{titre}</h1>
            {sousTitre && <p className="max-w-2xl text-[15px] text-[#C9D5D0]">{sousTitre}</p>}
          </div>
        )}
      </div>

      <main className="conteneur -mt-12 flex flex-1 flex-col gap-5 pb-10">
        {erreur && <MessageErreur>{erreur}</MessageErreur>}
        {chargement ? <div className="carte"><Chargement /></div> : children}
      </main>

      <footer className="conteneur flex flex-wrap justify-between gap-2 pb-8 text-[13px] text-encre-pale">
        <span>{derniereMaj ? `Mis à jour le ${dateHeure(derniereMaj)}` : 'Aucune opération enregistrée pour le moment'}</span>
        <span>
          {parametres.telephoneContact && (
            <>
              Infos famille :{' '}
              <a href={lienTelephone(parametres.telephoneContact)} className="font-bold text-recu">{parametres.telephoneContact}</a> ·{' '}
            </>
          )}
          Consultation en lecture seule · Données tenues par le trésorier de la famille ·{' '}
          <a href="/obseques-amemavor/admin" target="_blank" rel="noopener noreferrer" className="font-bold text-recu">Espace trésorier</a>
        </span>
      </footer>

      <nav
        aria-label="Navigation"
        className="pas-imprimer fixed inset-x-2 bottom-2 z-40 mx-auto grid max-w-[640px] grid-cols-7 gap-0.5 rounded-[20px] bg-white p-1.5 shadow-[0_8px_30px_rgba(15,42,34,0.18)] lg:hidden"
      >
        {LIENS.map((l) => (
          <NavLink
            key={l.vers}
            to={l.vers}
            end
            className={({ isActive }) =>
              classes(
                'flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 text-[10px] font-bold leading-none no-underline',
                isActive ? 'bg-foret text-white' : 'text-encre-douce',
              )
            }
          >
            <l.icone taille={19} />
            {l.court ?? l.libelle}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
