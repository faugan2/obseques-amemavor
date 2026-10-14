// Bloc « Cérémonies d'adieu » : affiché tant qu'il reste une cérémonie à venir,
// puis masqué automatiquement (après le 31 octobre pour le programme actuel).
import { useDonnees } from '../lib/donnees';
import { ceremoniesAVenir } from '../lib/calculs';
import { aujourdHui, jourLong, lienTelephone } from '../lib/format';

export function Ceremonies() {
  const { parametres } = useDonnees();
  const aVenir = ceremoniesAVenir(parametres.ceremonies ?? [], aujourdHui());
  if (aVenir.length === 0) return null;

  return (
    <section aria-labelledby="titre-ceremonies" className="overflow-hidden rounded-[22px] border border-or/40 bg-white shadow-carte">
      <div className="flex flex-col gap-1 border-b border-or/30 bg-[#FBF7EC] px-6 py-5">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-or-fonce">Programme des obsèques</div>
        <h2 id="titre-ceremonies" className="font-titre text-[26px] font-normal italic text-[#7A5A16]">Cérémonies d'adieu</h2>
      </div>
      <ol className="divide-y divide-trait">
        {aVenir.map((c) => (
          <li key={`${c.date}-${c.heure}-${c.titre}`} className="flex flex-wrap gap-x-6 gap-y-1 px-6 py-4">
            <div className="min-w-[200px] text-[15px] font-extrabold">
              {jourLong(c.date)} <span className="font-bold text-or-fonce">à {c.heure}</span>
            </div>
            <div className="flex min-w-[240px] flex-1 flex-col">
              <span className="text-[15px] font-bold">{c.titre}</span>
              <span className="text-sm text-encre-douce">{c.lieu}</span>
            </div>
          </li>
        ))}
      </ol>
      {(parametres.infoSalutations || parametres.telephoneContact) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FBF7EC] px-6 py-4 text-sm">
          {parametres.infoSalutations && <span className="text-encre-douce">{parametres.infoSalutations}</span>}
          {parametres.telephoneContact && (
            <a
              href={lienTelephone(parametres.telephoneContact)}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-foret px-4 font-extrabold text-white no-underline"
            >
              Infos : {parametres.telephoneContact}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
