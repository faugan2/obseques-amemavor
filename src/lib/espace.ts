// Séparation des données de démonstration et des données réelles.
// Toutes les collections portent le préfixe « ame_ ».
//   réel : ame_contributions, ame_dons, ame_depenses, ame_postes, ame_devis, ame_historique, ame_parametres
//   démo : ame_demo_contributions, ame_demo_dons, ...
// Les administrateurs (ame_admins) sont communs aux deux espaces.

export type NomCollection = 'contributions' | 'dons' | 'depenses' | 'postes' | 'devis' | 'emprunts' | 'libelles' | 'historique' | 'parametres';

// Utiliser toujours le mode démo (ame_demo_...)
export const ESPACE: 'demo' | 'reel' = 'demo';
export const EST_DEMO = ESPACE === 'demo';

export function nomCollection(nom: NomCollection, espace: 'demo' | 'reel' = ESPACE): string {
  return espace === 'demo' ? `ame_demo_${nom}` : `ame_${nom}`;
}

export const COLLECTION_ADMINS = 'ame_admins';
export const DOC_PARAMETRES = 'general';

export function dossierJustificatifs(espace: 'demo' | 'reel' = ESPACE): string {
  return `ame/${espace}/justificatifs`;
}
