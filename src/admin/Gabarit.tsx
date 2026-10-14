import { useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDonnees } from '../lib/donnees';
import { BandeauDemo, Chargement, MessageErreur, classes } from '../composants/ui';
import {
  IconeCadeau,
  IconeCadenas,
  IconeDocument,
  IconeFlecheBas,
  IconeFlecheHaut,
  IconeHistorique,
  IconeMenu,
  IconeReglages,
  IconeTableau,
} from '../composants/icones';

const MENU = [
  { vers: '/admin', libelle: 'Tableau de bord', icone: IconeTableau, fin: true },
  { vers: '/admin/contribution/nouvelle', libelle: 'Nouvelle contribution', icone: IconeFlecheHaut },
  { vers: '/admin/don/nouveau', libelle: 'Nouveau don en nature', icone: IconeCadeau },
  { vers: '/admin/depense/nouvelle', libelle: 'Nouvelle dépense', icone: IconeFlecheBas },
  { vers: '/admin/historique', libelle: 'Historique', icone: IconeHistorique },
  { vers: '/admin/rapport', libelle: 'Rapports et exports', icone: IconeDocument },
  { vers: '/admin/parametres', libelle: 'Paramètres', icone: IconeReglages },
];

/** Protège les pages d'administration : redirige vers la connexion si besoin. */
export function Protection({ children }: { children: ReactNode }) {
  const { utilisateur, estAdmin, chargement } = useAuth();
  const lieu = useLocation();
  if (chargement) return <Chargement texte="Vérification de la connexion…" />;
  if (!utilisateur || !estAdmin) return <Navigate to="/admin/connexion" replace state={{ de: lieu.pathname }} />;
  return <>{children}</>;
}

export function GabaritAdmin({ titre, sousTitre, actions, children }: { titre: string; sousTitre?: string; actions?: ReactNode; children: ReactNode }) {
  const { utilisateur, deconnexion } = useAuth();
  const { parametres, erreur } = useDonnees();
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <BandeauDemo />
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="pas-imprimer flex flex-col bg-foret text-[#D9E3DF] lg:w-[250px] lg:shrink-0">
          <div className="flex items-center justify-between gap-3 px-5 py-5">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-or">Administration</span>
              <span className="text-sm font-bold text-white">{parametres.nomDefunt}</span>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-white/10 lg:hidden"
              aria-expanded={menuOuvert}
              aria-controls="menu-admin"
              aria-label="Menu"
              onClick={() => setMenuOuvert(!menuOuvert)}
            >
              <IconeMenu />
            </button>
          </div>
          <div id="menu-admin" className={classes('flex-1 flex-col gap-6 px-4 pb-6 lg:flex', menuOuvert ? 'flex' : 'hidden')}>
            <nav aria-label="Menu administration" className="flex flex-col gap-1">
              {MENU.map((m) => (
                <NavLink
                  key={m.vers}
                  to={m.vers}
                  end={m.fin}
                  onClick={() => setMenuOuvert(false)}
                  className={({ isActive }) =>
                    classes(
                      'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm no-underline',
                      isActive ? 'bg-white/10 font-bold text-white' : 'font-semibold text-[#D9E3DF] hover:bg-white/5',
                    )
                  }
                >
                  <m.icone taille={18} />
                  {m.libelle}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2.5 border-t border-white/10 px-2 pt-4 text-[13px]">
              <Link to="/" className="font-bold text-or-clair no-underline">Voir l'espace familial ↗</Link>
              <span className="truncate text-[#9FB3AB]">{utilisateur?.email}</span>
              <button type="button" onClick={() => deconnexion()} className="self-start font-semibold text-[#D9E3DF] underline">
                Se déconnecter
              </button>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-8">
          <div className="pas-imprimer flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <h1 className="font-titre text-[30px] font-normal leading-tight sm:text-[34px]">{titre}</h1>
                <BandeauDemo compact />
              </div>
              {sousTitre && <div className="text-sm text-encre-pale">{sousTitre}</div>}
            </div>
            {actions}
          </div>
          {parametres.cloture && (
            <div className="pas-imprimer flex items-center gap-3 rounded-2xl bg-encre p-4 text-sm font-semibold text-white">
              <IconeCadenas taille={18} />
              Le suivi est clôturé : les comptes sont figés. Réouverture possible dans les Paramètres.
            </div>
          )}
          {erreur && <MessageErreur>{erreur}</MessageErreur>}
          {children}
        </main>
      </div>
    </div>
  );
}
