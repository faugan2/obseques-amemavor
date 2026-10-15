#!/usr/bin/env node
/**
 * Script pour extraire les libellés uniques des fichiers CSV
 * et les afficher en JSON
 */

import fs from 'fs';

function extraireLibelles() {
  try {
    console.log('📂 Extraction des libellés des fichiers CSV...\n');

    // Lire les fichiers uploadés
    const budgetPath = '/root/.claude/uploads/1458d8dc-2abd-5e44-add2-33012342f005/c290d8b7-BUDGET_REALISATIONS_OBSEQUES.csv';
    const depensesPath = '/root/.claude/uploads/1458d8dc-2abd-5e44-add2-33012342f005/e681959f-DEPENSES_COURANTES.csv';

    const budgetContent = fs.readFileSync(budgetPath, 'latin1'); // UTF-8 avec caractères spéciaux
    const depensesContent = fs.readFileSync(depensesPath, 'latin1');

    const libelles = new Set();

    // Du budget
    const budgetLines = budgetContent.split('\n');
    budgetLines.forEach((line, index) => {
      if (index === 0) return;
      const cells = line.split(';');
      const libelle = cells[0]?.trim();
      if (libelle && libelle.length > 3 && !libelle.match(/^(TOTAL|Cotisations|Participations|Dépenses|Reliquat|Point Global)/i)) {
        libelles.add(libelle);
      }
    });

    // Des dépenses
    const depensesLines = depensesContent.split('\n');
    depensesLines.forEach((line, index) => {
      if (index === 0) return;
      const cells = line.split(';');
      const libelle = cells[0]?.trim();
      if (libelle && libelle.length > 3 && !libelle.match(/^(TOTAL|Cotisations|Participations|Dépenses|Reliquat|Point Global|SOLDE|WIFI|Provision|Salaire)/i)) {
        libelles.add(libelle);
      }
    });

    const libellesArray = Array.from(libelles)
      .filter(l => l && l.length > 0)
      .sort();

    console.log(`✅ ${libellesArray.length} libellés uniques trouvés\n`);
    console.log('═'.repeat(60));

    libellesArray.forEach((l, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. ${l}`);
    });

    console.log('═'.repeat(60));

    // Générer le JSON pour Firestore
    const json = libellesArray.map((nom, index) => ({
      nom: nom.trim(),
      description: '',
      ordre: (index + 1) * 10,
    }));

    console.log('\n📋 JSON pour Firestore (copie dans la console Firestore):');
    console.log(JSON.stringify(json, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

extraireLibelles();
