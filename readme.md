# CQAS - Contrôle Qualité par Attributs avec Shapiro

Application web pour l'analyse statistique de contrôle qualité utilisant la méthode Shapiro-Wilk.

## Fonctionnalités

- Saisie de données par échantillons ou valeurs brutes
- Calcul des statistiques descriptives
- Test de normalité de Shapiro-Wilk
- Analyse de capabilité (Cp, Cpk, Cm, Cmk)
- Cartes de contrôle X-bar et R
- Export des résultats en format Excel et CSV

## Utilisation

1. Ouvrir `index.html` dans un navigateur web
2. Choisir le type de données (échantillons ou valeurs brutes)
3. Saisir les données et paramètres (TS, TI, NQA)
4. Cliquer sur "Calculer les Statistiques"
5. Consulter les résultats dans les différents onglets
6. Exporter les résultats avec le bouton "Exporter les Résultats"

## Formats d'export

- **Excel (.xlsx)** : Rapport complet avec plusieurs feuilles
- **CSV (.csv)** : Données brutes au format texte

## Technologies utilisées

- HTML5, CSS3, JavaScript
- Chart.js pour les graphiques
- SheetJS pour l'export Excel

## Compatibilité

Compatible avec tous les navigateurs modernes (Chrome, Firefox, Safari, Edge)