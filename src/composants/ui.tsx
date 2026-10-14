import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { EST_DEMO } from '../lib/espace';
import { initiales } from '../lib/format';
import { IconeAlerte, IconeCoche, IconeCroix } from './icones';

export function classes(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ');
}

export function BandeauDemo({ compact = false }: { compact?: boolean }) {
  if (!EST_DEMO) return null;
  return compact ? (
    <span className="rounded-md bg-or px-2 py-1 text-[11px] font-extrabold tracking-wide text-[#2A1F05]">DÉMO</span>
  ) : (
    <div className="pas-imprimer bg-or px-4 py-[7px] text-center text-[11px] font-extrabold tracking-[0.08em] text-[#2A1F05]">
      DÉMONSTRATION · DONNÉES FICTIVES
    </div>
  );
}

const TEINTES = ['bg-recu text-white', 'bg-foret text-or-clair', 'bg-nature text-white', 'bg-[#1F4E8C] text-white', 'bg-depense text-white'];

export function Avatar({ nom, taille = 40 }: { nom: string; taille?: number }) {
  let h = 0;
  for (const ch of nom) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <div
      className={classes('flex shrink-0 items-center justify-center rounded-full font-extrabold', TEINTES[h % TEINTES.length])}
      style={{ width: taille, height: taille, fontSize: taille * 0.33 }}
      aria-hidden="true"
    >
      {initiales(nom)}
    </div>
  );
}

type Ton = 'recu' | 'depense' | 'attente' | 'nature' | 'neutre' | 'annule';

const TONS: Record<Ton, string> = {
  recu: 'bg-recu-pale text-recu-fonce',
  depense: 'bg-depense-pale text-depense-fonce',
  attente: 'bg-attente-pale text-attente',
  nature: 'bg-nature-pale text-nature',
  neutre: 'bg-trait text-encre-douce',
  annule: 'bg-[#EEE] text-[#555] line-through',
};

export function Puce({ ton, children }: { ton: Ton; children: ReactNode }) {
  return <span className={classes('inline-block whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold', TONS[ton])}>{children}</span>;
}

export function Donut({ part, taille = 120 }: { part: number; taille?: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const pct = Math.round(part * 100);
  return (
    <div className="relative shrink-0" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} viewBox="0 0 88 88" role="img" aria-label={`${pct} % de l'argent reçu a été dépensé`}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#E3F1EA" strokeWidth="9" />
        {part > 0 && (
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke="#B4472A"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${circ * part} ${circ}`}
            transform="rotate(-90 44 44)"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-extrabold" style={{ fontSize: taille * 0.18 }}>{pct} %</div>
        <div className="text-[11px] font-semibold text-encre-pale">utilisé</div>
      </div>
    </div>
  );
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-encre-pale" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-bord border-t-recu" />
      {texte}
    </div>
  );
}

export function MessageErreur({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-[#E7B9AB] bg-depense-pale p-4 text-sm text-depense-fonce">
      <IconeAlerte taille={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function EtatVide({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <div className="rounded-[20px] border-[1.5px] border-dashed border-[#C9CDC4] p-8 text-center">
      <div className="font-titre text-xl">{titre}</div>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-encre-pale">{children}</div>}
    </div>
  );
}

export function Bascule({
  actif,
  onChange,
  libelle,
  description,
}: {
  actif: boolean;
  onChange: (v: boolean) => void;
  libelle: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-trait py-3">
      <div className="flex flex-col">
        <span className="text-sm font-bold">{libelle}</span>
        {description && <span className="text-xs text-encre-pale">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        aria-label={libelle}
        onClick={() => onChange(!actif)}
        className={classes('relative h-[30px] w-[52px] shrink-0 rounded-full transition', actif ? 'bg-recu' : 'bg-[#C9CDC4]')}
      >
        <span className={classes('absolute top-[3px] h-6 w-6 rounded-full bg-white transition-all', actif ? 'left-[25px]' : 'left-[3px]')} />
      </button>
    </div>
  );
}

/** Groupe de gros boutons à choix unique (accessible au clavier). */
export function Segments<T extends string>({
  legende,
  valeur,
  options,
  onChange,
  colonnes = 3,
}: {
  legende: string;
  valeur: T;
  options: { valeur: T; libelle: string; aide?: string; ton?: 'recu' | 'attente' | 'nature' | 'depense' }[];
  onChange: (v: T) => void;
  colonnes?: number;
}) {
  const tonActif: Record<string, string> = {
    recu: 'border-2 border-recu bg-recu-pale text-recu-fonce',
    attente: 'border-2 border-[#94620A] bg-attente-pale text-attente-fonce',
    nature: 'border-2 border-nature bg-nature-pale text-nature-fonce',
    depense: 'border-2 border-depense bg-depense-pale text-depense-fonce',
  };
  return (
    <fieldset>
      <legend className="etiquette mb-2">{legende}</legend>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${colonnes > 2 ? 140 : 160}px, 1fr))` }}>
        {options.map((o) => {
          const actif = o.valeur === valeur;
          return (
            <button
              key={o.valeur}
              type="button"
              aria-pressed={actif}
              onClick={() => onChange(o.valeur)}
              className={classes(
                'flex min-h-[56px] flex-col justify-center rounded-[14px] px-4 py-2 text-left transition',
                actif ? tonActif[o.ton ?? 'recu'] : 'border border-bord bg-white hover:border-encre-pale',
              )}
            >
              <span className="text-[15px] font-extrabold">{o.libelle}</span>
              {o.aide && <span className={classes('text-xs', actif ? 'opacity-90' : 'text-encre-pale')}>{o.aide}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Champ({
  id,
  libelle,
  facultatif,
  erreur,
  aide,
  children,
}: {
  id: string;
  libelle: string;
  facultatif?: boolean;
  erreur?: string;
  aide?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="etiquette">
        {libelle} {facultatif && <span className="font-medium text-encre-pale">(facultatif)</span>}
      </label>
      {children}
      {erreur ? (
        <div id={`${id}-erreur`} className="text-[13px] text-[#B3261E]">{erreur}</div>
      ) : (
        aide && <div className="text-xs text-encre-pale">{aide}</div>
      )}
    </div>
  );
}

// ---------- Notifications (messages de confirmation) ----------

interface Notif {
  id: number;
  texte: string;
  ton: 'succes' | 'erreur';
}

const CtxNotif = createContext<(texte: string, ton?: 'succes' | 'erreur') => void>(() => {});

export function FournisseurNotifications({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notif[]>([]);
  const compteur = useRef(0);
  const notifier = useCallback((texte: string, ton: 'succes' | 'erreur' = 'succes') => {
    const id = ++compteur.current;
    setListe((l) => [...l, { id, texte, ton }]);
    setTimeout(() => setListe((l) => l.filter((n) => n.id !== id)), 5000);
  }, []);
  return (
    <CtxNotif.Provider value={notifier}>
      {children}
      <div className="pas-imprimer fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {liste.map((n) => (
          <div
            key={n.id}
            className={classes(
              'flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-flottante',
              n.ton === 'succes' ? 'bg-recu-fonce text-white' : 'bg-depense-fonce text-white',
            )}
          >
            {n.ton === 'succes' ? <IconeCoche taille={18} /> : <IconeAlerte taille={18} />}
            <span className="flex-1">{n.texte}</span>
            <button
              type="button"
              aria-label="Fermer"
              className="rounded-lg p-1 hover:bg-white/10"
              onClick={() => setListe((l) => l.filter((x) => x.id !== n.id))}
            >
              <IconeCroix taille={16} />
            </button>
          </div>
        ))}
      </div>
    </CtxNotif.Provider>
  );
}

export const useNotifier = () => useContext(CtxNotif);

// ---------- Fenêtre modale ----------

export function Modale({ ouverte, onFermer, titre, children }: { ouverte: boolean; onFermer: () => void; titre: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ouverte && !d.open) d.showModal();
    if (!ouverte && d.open) d.close();
  }, [ouverte]);
  return (
    <dialog
      ref={ref}
      onClose={onFermer}
      aria-label={titre}
      className="w-[min(92vw,440px)] rounded-[22px] p-0 shadow-flottante backdrop:bg-foret/50"
    >
      {ouverte && <div className="p-6">{children}</div>}
    </dialog>
  );
}
