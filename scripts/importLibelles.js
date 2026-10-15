#!/usr/bin/env node
/**
 * Script d'import des libellés depuis les fichiers Excel
 * Extrait les libellés uniques du budget et des dépenses
 * et les ajoute à la collection Firestore ame_libelles
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialiser Firebase Admin SDK
const serviceAccount = require('../firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importerLibelles() {
  try {
    console.log('📂 Lecture des fichiers CSV...');

    // Chemin des fichiers (relatif au dossier du script)
    const budgetPath = path.join(__dirname, '../Budget.csv');
    const depensesPath = path.join(__dirname, '../Depenses.csv');

    if (!fs.existsSync(budgetPath)) {
      console.error('❌ Budget.csv non trouvé');
      process.exit(1);
    }
    if (!fs.existsSync(depensesPath)) {
      console.error('❌ Depenses.csv non trouvé');
      process.exit(1);
    }

    // Lire les fichiers
    const budgetContent = fs.readFileSync(budgetPath, 'utf-8');
    const depensesContent = fs.readFileSync(depensesPath, 'utf-8');

    // Extraire les libellés (première colonne de chaque ligne non-vide)
    const libelles = new Set();

    // Du budget (colonne POSTES DE DEPENSES)
    const budgetLines = budgetContent.split('\n');
    budgetLines.forEach((line, index) => {
      if (index === 0) return; // Skip en-tête
      const cells = line.split(';');
      const libelle = cells[0]?.trim();
      if (libelle && libelle.length > 2) {
        libelles.add(libelle);
      }
    });

    // Des dépenses (colonne POSTES DE DEPENSES)
    const depensesLines = depensesContent.split('\n');
    depensesLines.forEach((line, index) => {
      if (index === 0) return; // Skip en-tête
      const cells = line.split(';');
      const libelle = cells[0]?.trim();
      if (libelle && libelle.length > 2) {
        libelles.add(libelle);
      }
    });

    const libellesArray = Array.from(libelles).sort();
    console.log(`\n✅ ${libellesArray.length} libellés uniques trouvés\n`);

    // Afficher les libellés
    libellesArray.forEach((l, i) => {
      console.log(`${i + 1}. ${l}`);
    });

    // Demander confirmation avant d'importer
    console.log('\n⚠️  Importer ces libellés dans Firestore? (y/n)');

    // Pour les tests, on va directement importer
    // Dans un vrai script interactif, il faudrait readline
    await importer(libellesArray);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

async function importer(libellesArray) {
  try {
    console.log('\n📝 Importation dans Firestore...');

    const batch = db.batch();
    const collection = db.collection('ame_libelles');

    libellesArray.forEach((libelle, index) => {
      const id = `libelle-${Date.now()}-${index}`;
      const doc = collection.doc(id);

      batch.set(doc, {
        nom: libelle,
        description: '',
        ordre: (index + 1) * 10,
        annule: false,
        creePar: 'import-script',
        creeLe: admin.firestore.Timestamp.now(),
        modifieLe: admin.firestore.Timestamp.now(),
        derniereOperation: '',
      });
    });

    await batch.commit();
    console.log(`✅ ${libellesArray.length} libellés importés avec succès!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    process.exit(1);
  }
}

importerLibelles();
