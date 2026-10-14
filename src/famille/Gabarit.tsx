import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Chargement, MessageErreur, classes } from '../composants/ui';
import { IconeCadeau, IconeColombe, IconeFlecheBas, IconeFlecheHaut, IconeMaison } from '../composants/icones';
import { useDonnees } from '../lib/donnees';
import { dateHeure, lienTelephone } from '../lib/format';

const LIENS = [
  { vers: '/', libelle: 'Accueil', icone: IconeMaison },
  { vers: '/recu', libelle: 'Argent reçu', court: 'Reçu', icone: IconeFlecheHaut },
  { vers: '/nature', libelle: 'Dons en nature', court: 'En nature', icone: IconeCadeau },
  { vers: '/depenses', libelle: 'Dépenses', icone: IconeFlecheBas },
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
    <div className="flex min-h-screen flex-col pb-24 sm:pb-0">
      <div className="bg-foret text-white">
        <div className="conteneur flex flex-wrap items-center justify-between gap-3 py-4">
          <Link to="/" className="flex items-center gap-2.5 text-white no-underline">
            <Embleme />
            <span className="text-sm font-bold">Obsèques · {parametres.nomDefunt}</span>
          </Link>
          <nav aria-label="Rubriques" className="hidden flex-wrap gap-1 sm:flex">
            {LIENS.map((l) => (
              <NavLink
                key={l.vers}
                to={l.vers}
                end
                className={({ isActive }) =>
                  classes(
                    'flex min-h-[40px] items-center rounded-full px-4 text-sm no-underline transition',
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
          <Link to="/admin" className="font-bold text-recu">Espace trésorier</Link>
        </span>
      </footer>

      <nav
        aria-label="Navigation"
        className="pas-imprimer fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-[22px] bg-white p-2 shadow-[0_8px_30px_rgba(15,42,34,0.18)] sm:hidden"
      >
        {LIENS.map((l) => (
          <NavLink
            key={l.vers}
            to={l.vers}
            end
            className={({ isActive }) =>
              classes(
                'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold no-underline',
                isActive ? 'bg-foret text-white' : 'text-encre-douce',
              )
            }
          >
            <l.icone taille={20} />
            {l.court ?? l.libelle}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
