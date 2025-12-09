// Variables globales optimisées
let dataSamples = [];
let rawData = [];
let analysisResults = {};
let charts = {
    normality: null,
    capability: null,
    xbar: null,
    r: null
};

// Configuration des échantillons (sauvegarde des paramètres utilisateur)
let userSampleConfig = {
    sampleCount: 3,
    sampleSize: 5
};

// Constantes pour les calculs statistiques
const SHAPIRO_COEFFICIENTS = {
    3: [0.7071],
    4: [0.6872, 0.1677],
    5: [0.6646, 0.2413],
    6: [0.6431, 0.2806, 0.0875],
    7: [0.6233, 0.3031, 0.1401],
    8: [0.6052, 0.3164, 0.1743, 0.0561],
    9: [0.5888, 0.3244, 0.1976, 0.0947],
    10: [0.5739, 0.3291, 0.2141, 0.1224, 0.0399]
};

const SHAPIRO_CRITICAL_VALUES = {
    3: 0.767, 4: 0.748, 5: 0.762, 6: 0.788, 7: 0.803,
    8: 0.818, 9: 0.829, 10: 0.842, 15: 0.881, 20: 0.905,
    25: 0.918, 30: 0.927, 40: 0.941, 50: 0.947
};

const D2_VALUES = {
    2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326,
    6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078
};

const A2_VALUES = {
    2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577,
    6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308
};

const D3_VALUES = {
    2: 0, 3: 0, 4: 0, 5: 0,
    6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223
};

const D4_VALUES = {
    2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114,
    6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777
};

// Fonction d'initialisation optimisée
function initializeApp() {
    initializeInputArea();
    setupEventListeners();
    validateInputs();
}

// Fonction d'initialisation de la zone de saisie
function initializeInputArea() {
    const dataType = document.getElementById('dataType').value;
    const inputArea = document.getElementById('inputArea');
    
    if (dataType === 'sample') {
        // Récupérer les valeurs actuelles
        const sampleCountInput = document.getElementById('sampleCount');
        const sampleSizeInput = document.getElementById('sampleSize');
        
        if (sampleCountInput && sampleSizeInput) {
            userSampleConfig.sampleCount = parseInt(sampleCountInput.value) || 3;
            userSampleConfig.sampleSize = parseInt(sampleSizeInput.value) || 5;
        }
        
        inputArea.innerHTML = `
            <div class="form-group">
                <label for="sampleCount">Nombre d'échantillons (k) :</label>
                <input type="number" id="sampleCount" min="2" max="10" value="${userSampleConfig.sampleCount}">
                <span class="help-text">Maximum 10 échantillons (n*k ≤ 50)</span>
            </div>
            
            <div class="form-group">
                <label for="sampleSize">Taille des échantillons (n) :</label>
                <input type="number" id="sampleSize" min="2" max="25" value="${userSampleConfig.sampleSize}">
                <span class="help-text">Maximum 25 mesures par échantillon (n*k ≤ 50)</span>
            </div>
            
            <div class="form-group">
                <label>Saisie des données par échantillon :</label>
                <div class="data-table" id="sampleDataTable">
                    <!-- Tableau généré dynamiquement -->
                </div>
            </div>
        `;
        
        generateSampleTable();
        
        // Écouteurs avec debouncing pour améliorer les performances
        let debounceTimer;
        const debounce = (func, delay) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(func, delay);
        };
        
        ['sampleCount', 'sampleSize'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                debounce(() => {
                    userSampleConfig.sampleCount = parseInt(document.getElementById('sampleCount').value) || 3;
                    userSampleConfig.sampleSize = parseInt(document.getElementById('sampleSize').value) || 5;
                    generateSampleTable();
                }, 300);
            });
        });
    } else {
        inputArea.innerHTML = `
            <div class="form-group">
                <label for="rawData">Liste des valeurs (séparées par des virgules) :</label>
                <textarea id="rawData" placeholder="Exemple: 19.97, 19.98, 19.99, 20.00, 20.00, 20.00, 20.00, 20.02, 20.03">19.97, 19.98, 19.99, 20.00, 20.00, 20.00, 20.00, 20.02, 20.03</textarea>
                <span class="help-text">Maximum 50 valeurs</span>
            </div>
        `;
    }
}

// Génération optimisée du tableau d'échantillons
function generateSampleTable() {
    const sampleCount = Math.min(Math.max(userSampleConfig.sampleCount, 2), 10);
    const sampleSize = Math.min(Math.max(userSampleConfig.sampleSize, 2), 25);
    
    // Validation du produit n*k
    if (sampleCount * sampleSize > 50) {
        alert('Le produit n*k ne doit pas dépasser 50. Ajustez les valeurs.');
        userSampleConfig.sampleSize = Math.floor(50 / sampleCount);
        document.getElementById('sampleSize').value = userSampleConfig.sampleSize;
        return generateSampleTable();
    }
    
    const tableContainer = document.getElementById('sampleDataTable');
    
    let tableHTML = '<div class="table-container"><table><thead><tr><th class="sample-label">Échantillon</th>';
    
    // En-tête
    for (let i = 1; i <= sampleSize; i++) {
        tableHTML += `<th>M${i}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';
    
    // Lignes de données
    for (let i = 1; i <= sampleCount; i++) {
        tableHTML += `<tr><td class="sample-label">Éch. ${i}</td>`;
        for (let j = 1; j <= sampleSize; j++) {
            const inputId = `sample-${i}-${j}`;
            const existingInput = document.getElementById(inputId);
            const defaultValue = existingInput ? existingInput.value : (19.9 + Math.random() * 0.2).toFixed(3);
            tableHTML += `<td><input type="number" step="0.001" id="${inputId}" value="${defaultValue}" data-sample="${i}" data-measure="${j}"></td>`;
        }
        tableHTML += '</tr>';
    }
    
    tableHTML += '</tbody></table></div>';
    tableContainer.innerHTML = tableHTML;
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    document.getElementById('dataType').addEventListener('change', initializeInputArea);
    document.getElementById('calculateBtn').addEventListener('click', handleCalculate);
    document.getElementById('resetBtn').addEventListener('click', resetApplication);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
    
    // Validation en temps réel
    ['ts', 'ti', 'nqa'].forEach(id => {
        document.getElementById(id).addEventListener('input', validateInputs);
    });
    
    // Gestion des onglets
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
}

// Validation des entrées
function validateInputs() {
    const ts = parseFloat(document.getElementById('ts').value);
    const ti = parseFloat(document.getElementById('ti').value);
    const nqa = parseFloat(document.getElementById('nqa').value);
    
    let isValid = true;
    
    if (isNaN(ts) || isNaN(ti)) {
        isValid = false;
        document.getElementById('ts').style.borderColor = 'var(--accent)';
        document.getElementById('ti').style.borderColor = 'var(--accent)';
    } else if (ts <= ti) {
        isValid = false;
        document.getElementById('ts').style.borderColor = 'var(--accent)';
        document.getElementById('ti').style.borderColor = 'var(--accent)';
        alert('TS doit être supérieure à TI');
    } else {
        document.getElementById('ts').style.borderColor = '';
        document.getElementById('ti').style.borderColor = '';
    }
    
    if (isNaN(nqa) || nqa < 0 || nqa > 100) {
        isValid = false;
        document.getElementById('nqa').style.borderColor = 'var(--accent)';
        alert('NQA doit être un pourcentage entre 0 et 100');
    } else {
        document.getElementById('nqa').style.borderColor = '';
    }
    
    return isValid;
}

// Récupération des données d'échantillons - CORRIGÉE
function getSampleData() {
    const samples = [];
    let totalValidValues = 0;
    
    for (let i = 1; i <= userSampleConfig.sampleCount; i++) {
        const sample = [];
        let sampleValidValues = 0;
        
        for (let j = 1; j <= userSampleConfig.sampleSize; j++) {
            const inputId = `sample-${i}-${j}`;
            const input = document.getElementById(inputId);
            
            if (input) {
                const value = parseFloat(input.value);
                if (!isNaN(value)) {
                    sample.push(value);
                    sampleValidValues++;
                    totalValidValues++;
                    input.classList.remove('invalid');
                    input.classList.add('valid');
                } else {
                    sample.push(NaN);
                    input.classList.remove('valid');
                    input.classList.add('invalid');
                }
            } else {
                sample.push(NaN);
            }
        }
        
        // Ajouter l'échantillon même s'il contient des NaN
        samples.push(sample);
        
        // Afficher un warning si l'échantillon a moins de 2 valeurs valides
        if (sampleValidValues < 2 && sampleValidValues > 0) {
            console.warn(`Échantillon ${i} a seulement ${sampleValidValues} valeur(s) valide(s) - minimum recommandé: 2`);
        }
    }
    
    console.log(`${totalValidValues} valeurs valides récupérées sur ${userSampleConfig.sampleCount * userSampleConfig.sampleSize} possibles`);
    return samples;
}

// Récupération des données brutes
function getRawData() {
    const rawDataString = document.getElementById('rawData').value;
    const values = rawDataString.split(/[,\s]+/)
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
    
    console.log(`${values.length} valeurs brutes récupérées`);
    return values;
}

// Aplatir les échantillons en filtrant les NaN
function flattenSamples(samples) {
    const flattened = [];
    samples.forEach(sample => {
        sample.forEach(value => {
            if (!isNaN(value)) {
                flattened.push(value);
            }
        });
    });
    return flattened;
}

// Regroupement des données brutes en échantillons - CORRIGÉE
function groupIntoSamples(data) {
    if (data.length === 0) return [];
    
    // Pour les données brutes, on utilise la configuration par défaut ou on demande
    const dataType = document.getElementById('dataType').value;
    
    if (dataType === 'raw') {
        // Essayer d'utiliser la taille d'échantillon de la configuration utilisateur si disponible
        let sampleSize = userSampleConfig.sampleSize || 5;
        
        // Demander confirmation à l'utilisateur
        const userSize = prompt(
            `Vous avez ${data.length} données brutes.\n` +
            `Entrez la taille d'échantillon souhaitée (entre 2 et ${Math.min(25, data.length)}):`,
            Math.min(sampleSize, Math.floor(data.length / 3))
        );
        
        if (userSize !== null) {
            sampleSize = Math.min(Math.max(parseInt(userSize), 2), Math.min(25, data.length));
            userSampleConfig.sampleSize = sampleSize;
        }
        
        const samples = [];
        for (let i = 0; i < data.length; i += sampleSize) {
            const sample = data.slice(i, i + sampleSize);
            if (sample.length >= 2) { // On garde seulement les échantillons avec au moins 2 valeurs
                samples.push(sample);
            }
        }
        
        userSampleConfig.sampleCount = samples.length;
        console.log(`Données brutes regroupées en ${samples.length} échantillons de ${sampleSize} mesures`);
        return samples;
    }
    
    // Pour les données d'échantillons, on garde la structure originale
    const samples = [];
    dataSamples.forEach(sample => {
        const validSample = sample.filter(v => !isNaN(v));
        if (validSample.length >= 2) {
            samples.push(validSample);
        }
    });
    
    return samples;
}

// Gestion du calcul - AJOUT DE VALIDATION
async function handleCalculate() {
    if (!validateInputs()) {
        alert('Veuillez corriger les erreurs dans les champs de saisie.');
        return;
    }
    
    // Afficher l'indicateur de chargement
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('calculateBtn').disabled = true;
    
    try {
        // Récupérer les données selon le type choisi
        const dataType = document.getElementById('dataType').value;
        
        if (dataType === 'sample') {
            // Récupérer les échantillons saisis
            dataSamples = getSampleData();
            rawData = flattenSamples(dataSamples);
            
            // Vérifier qu'on a assez de données
            if (rawData.length < 3) {
                throw new Error(`Seulement ${rawData.length} valeur(s) valide(s). Minimum requis: 3 valeurs.`);
            }
            
            // Garder la structure des échantillons (même avec des NaN)
            const validSamples = dataSamples.map(sample => 
                sample.filter(v => !isNaN(v))
            ).filter(sample => sample.length >= 2);
            
            if (validSamples.length === 0) {
                throw new Error('Aucun échantillon valide (minimum 2 valeurs par échantillon).');
            }
            
            dataSamples = validSamples;
            
        } else {
            // Récupérer les données brutes
            rawData = getRawData();
            
            if (rawData.length < 3) {
                throw new Error(`Seulement ${rawData.length} valeur(s) valide(s). Minimum requis: 3 valeurs.`);
            }
            
            // Regrouper en échantillons
            dataSamples = groupIntoSamples(rawData);
            
            if (dataSamples.length === 0) {
                throw new Error('Impossible de créer des échantillons valides.');
            }
        }
        
        // Calculs statistiques
        analysisResults = await performAllCalculations(rawData, dataSamples);
        
        // Affichage des résultats
        displayResults();
        
        // Afficher la section des résultats
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('exportBtn').disabled = false;
        
    } catch (error) {
        alert(`Erreur: ${error.message}`);
        console.error('Erreur détaillée:', error);
    } finally {
        // Masquer l'indicateur de chargement
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('calculateBtn').disabled = false;
    }
}

// Calculs statistiques principaux
async function performAllCalculations(data, samples) {
    const descriptive = calculateDescriptiveStats(data, samples);
    const normality = performShapiroWilkTest(data);
    const capability = calculateCapabilityIndices(data, samples, descriptive);
    const controlCharts = calculateControlLimits(samples, descriptive);
    
    return { descriptive, normality, capability, controlCharts };
}

// Calcul des statistiques descriptives
function calculateDescriptiveStats(data, samples) {
    const n = data.length;
    
    if (n < 2) {
        throw new Error('Pas assez de données pour calculer les statistiques.');
    }
    
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    
    // Calcul de la variance
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);
    
    // Statistiques par échantillon
    const sampleStats = samples.map((sample, index) => {
        const sampleMean = sample.reduce((s, v) => s + v, 0) / sample.length;
        const sampleRange = Math.max(...sample) - Math.min(...sample);
        const sampleStd = Math.sqrt(sample.reduce((s, v) => s + Math.pow(v - sampleMean, 2), 0) / (sample.length - 1));
        return { 
            mean: sampleMean, 
            range: sampleRange,
            std: sampleStd,
            size: sample.length,
            values: [...sample]
        };
    });
    
    const sampleMeans = sampleStats.map(s => s.mean);
    const sampleRanges = sampleStats.map(s => s.range);
    const avgRange = sampleRanges.reduce((sum, r) => sum + r, 0) / samples.length;
    
    return {
        n,
        mean,
        variance,
        std,
        sampleCount: samples.length,
        sampleSize: samples.length > 0 ? samples[0].length : 0,
        sampleMeans,
        sampleRanges,
        avgRange,
        min: Math.min(...data),
        max: Math.max(...data),
        range: Math.max(...data) - Math.min(...data),
        data: [...data],
        sampleStats: sampleStats
    };
}

// Test de Shapiro-Wilk amélioré
function performShapiroWilkTest(data) {
    const n = data.length;
    
    if (n < 3) {
        return {
            w: 0,
            criticalValue: 0,
            pValue: 0,
            isNormal: false,
            message: "Minimum 3 données requises pour le test de Shapiro-Wilk."
        };
    }
    
    if (n > 50) {
        return {
            w: 0,
            criticalValue: 0,
            pValue: 0,
            isNormal: false,
            message: "Maximum 50 données pour le test de Shapiro-Wilk."
        };
    }
    
    // Données triées
    const sortedData = [...data].sort((a, b) => a - b);
    
    // Coefficients
    const coefficients = SHAPIRO_COEFFICIENTS[n] || Array(Math.floor(n/2)).fill(0.5);
    
    // Calcul de la statistique W
    let numerator = 0;
    for (let i = 0; i < Math.floor(n/2); i++) {
        numerator += coefficients[i] * (sortedData[n-1-i] - sortedData[i]);
    }
    
    const mean = sortedData.reduce((s, v) => s + v, 0) / n;
    const denominator = sortedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    const w = Math.pow(numerator, 2) / denominator;
    
    // Valeur critique et p-value approximative
    const criticalValue = getShapiroCriticalValue(n);
    const pValue = estimatePValue(w, n);
    
    const isNormal = w > criticalValue;
    
    return {
        w: Math.round(w * 10000) / 10000,
        criticalValue: Math.round(criticalValue * 10000) / 10000,
        pValue: Math.round(pValue * 10000) / 10000,
        isNormal,
        message: isNormal ? 
            "La distribution est normale (au seuil de 5%)" : 
            "La distribution n'est pas normale (au seuil de 5%)"
    };
}

// Obtention de la valeur critique Shapiro-Wilk
function getShapiroCriticalValue(n) {
    const keys = Object.keys(SHAPIRO_CRITICAL_VALUES).map(Number).sort((a, b) => a - b);
    
    if (n <= keys[0]) return SHAPIRO_CRITICAL_VALUES[keys[0]];
    if (n >= keys[keys.length - 1]) return SHAPIRO_CRITICAL_VALUES[keys[keys.length - 1]];
    
    // Interpolation linéaire
    for (let i = 0; i < keys.length - 1; i++) {
        if (n >= keys[i] && n <= keys[i+1]) {
            const t = (n - keys[i]) / (keys[i+1] - keys[i]);
            return SHAPIRO_CRITICAL_VALUES[keys[i]] + 
                   t * (SHAPIRO_CRITICAL_VALUES[keys[i+1]] - SHAPIRO_CRITICAL_VALUES[keys[i]]);
        }
    }
    
    return 0.9;
}

// Estimation de la p-value
function estimatePValue(w, n) {
    // Approximation simple de la p-value
    const transformed = Math.log(1 - w);
    const mu = -1.2725 + 1.0521 * Math.log(n);
    const sigma = 0.8038 - 0.3167 * Math.log(n) + 0.0411 * Math.pow(Math.log(n), 2);
    
    const z = (transformed - mu) / sigma;
    return 1 - Math.exp(-Math.exp(z));
}

// Calcul des indices de capabilité
function calculateCapabilityIndices(data, samples, descriptive) {
    const ts = parseFloat(document.getElementById('ts').value);
    const ti = parseFloat(document.getElementById('ti').value);
    const nqa = parseFloat(document.getElementById('nqa').value);
    
    const mean = descriptive.mean;
    const std = descriptive.std;
    const avgRange = descriptive.avgRange;
    const sampleSize = descriptive.sampleSize;
    
    // Calcul de sigma_i
    const d2 = D2_VALUES[sampleSize] || 1.0;
    const sigma_i = avgRange / d2;
    
    // Indices de capabilité
    const cp = (ts - ti) / (6 * std);
    const cpk = Math.min(
        (ts - mean) / (3 * std),
        (mean - ti) / (3 * std)
    );
    
    const cm = (ts - ti) / (6 * sigma_i);
    const cmk = Math.min(
        (ts - mean) / (3 * sigma_i),
        (mean - ti) / (3 * sigma_i)
    );
    
    // Estimation du % hors tolérance
    const zLower = (ti - mean) / std;
    const zUpper = (ts - mean) / std;
    const pLower = 0.5 * (1 + erf(zLower / Math.sqrt(2)));
    const pUpper = 0.5 * (1 + erf(zUpper / Math.sqrt(2)));
    const outOfTolerance = (pLower + (1 - pUpper)) * 100;
    
    return {
        cp: Math.max(0, Math.round(cp * 1000) / 1000),
        cpk: Math.max(0, Math.round(cpk * 1000) / 1000),
        cm: Math.max(0, Math.round(cm * 1000) / 1000),
        cmk: Math.max(0, Math.round(cmk * 1000) / 1000),
        ts,
        ti,
        nqa,
        sigma_i: Math.round(sigma_i * 1000) / 1000,
        d2,
        toleranceRange: (ts - ti).toFixed(4),
        outOfTolerance: Math.round(outOfTolerance * 1000) / 1000
    };
}

// Fonction d'erreur pour le calcul statistique
function erf(x) {
    // Approximation de la fonction d'erreur
    const sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);
    
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
}

// Calcul des limites de contrôle
function calculateControlLimits(samples, descriptive) {
    const sampleMeans = descriptive.sampleMeans;
    const sampleRanges = descriptive.sampleRanges;
    const overallMean = descriptive.mean;
    const avgRange = descriptive.avgRange;
    const sampleSize = descriptive.sampleSize;
    
    // Constantes
    const a2 = A2_VALUES[sampleSize] || 0.0;
    const d3 = D3_VALUES[sampleSize] || 0.0;
    const d4 = D4_VALUES[sampleSize] || 0.0;
    const d2 = D2_VALUES[sampleSize] || 1.0;
    
    // Limites X-bar
    const xbarUCL = overallMean + a2 * avgRange;
    const xbarLCL = overallMean - a2 * avgRange;
    
    // Limites R
    const rUCL = d4 * avgRange;
    const rLCL = d3 * avgRange;
    
    return {
        xbar: {
            means: sampleMeans,
            ucl: xbarUCL,
            lcl: Math.max(0, xbarLCL),
            center: overallMean
        },
        r: {
            ranges: sampleRanges,
            ucl: rUCL,
            lcl: Math.max(0, rLCL),
            center: avgRange
        },
        constants: { a2, d3, d4, d2 }
    };
}

// Affichage des résultats
function displayResults() {
    displayConfiguration();
    displaySummary();
    displayDescriptiveStats();
    displayNormalityTest();
    displayCapabilityAnalysis();
    displayControlCharts();
}

// Affichage de la configuration - NOUVELLE FONCTION
function displayConfiguration() {
    const configInfo = document.getElementById('configInfo');
    const dataType = document.getElementById('dataType').value;
    
    let configHTML = '<p><strong>Configuration de l\'analyse :</strong></p>';
    
    if (dataType === 'sample') {
        configHTML += `
            <p>• Mode : Saisie par échantillons</p>
            <p>• Configuration demandée : ${userSampleConfig.sampleCount} échantillons × ${userSampleConfig.sampleSize} mesures</p>
            <p>• Configuration effective : ${analysisResults.descriptive.sampleCount} échantillons × ${analysisResults.descriptive.sampleSize} mesures</p>
            <p>• Données totales analysées : ${analysisResults.descriptive.n} valeurs</p>
        `;
    } else {
        configHTML += `
            <p>• Mode : Données brutes</p>
            <p>• Données fournies : ${rawData.length} valeurs</p>
            <p>• Configuration effective : ${analysisResults.descriptive.sampleCount} échantillons × ${analysisResults.descriptive.sampleSize} mesures</p>
            <p>• Données totales analysées : ${analysisResults.descriptive.n} valeurs</p>
        `;
    }
    
    configInfo.innerHTML = configHTML;
}

// Affichage du résumé
function displaySummary() {
    const { descriptive, capability, normality } = analysisResults;
    
    document.getElementById('meanValue').textContent = descriptive.mean.toFixed(4);
    document.getElementById('stdValue').textContent = descriptive.std.toFixed(4);
    document.getElementById('cpValue').textContent = capability.cp;
    document.getElementById('cpkValue').textContent = capability.cpk;
    
    // Conclusion générale
    const conclusionEl = document.getElementById('conclusion');
    let conclusionClass = 'conclusion';
    let conclusionText = '';
    let statusIcon = '';
    
    if (normality.isNormal && capability.cpk >= 1.33) {
        conclusionClass += ' success';
        statusIcon = '<span class="status-indicator status-good"></span>';
        conclusionText = 'Le procédé est sous contrôle statistique et capable. La distribution est normale et les indices de capabilité sont satisfaisants.';
    } else if (normality.isNormal && capability.cpk >= 1.0) {
        conclusionClass += ' warning';
        statusIcon = '<span class="status-indicator status-warning"></span>';
        conclusionText = 'Le procédé est sous contrôle mais nécessite une surveillance. La distribution est normale mais la capabilité est marginale.';
    } else {
        conclusionClass += ' error';
        statusIcon = '<span class="status-indicator status-error"></span>';
        conclusionText = 'Le procédé nécessite des actions correctives. Vérifiez la normalité de la distribution et/ou la capabilité du procédé.';
    }
    
    conclusionEl.className = conclusionClass;
    conclusionEl.innerHTML = `<h3>${statusIcon} Conclusion</h3><p>${conclusionText}</p>`;
}

// Affichage des statistiques descriptives - CORRIGÉE
function displayDescriptiveStats() {
    const { descriptive } = analysisResults;
    
    document.getElementById('totalData').textContent = descriptive.n;
    document.getElementById('sampleCount').textContent = descriptive.sampleCount;
    document.getElementById('sampleSize').textContent = descriptive.sampleSize;
    document.getElementById('globalMean').textContent = descriptive.mean.toFixed(4);
    document.getElementById('globalStd').textContent = descriptive.std.toFixed(4);
    document.getElementById('avgRange').textContent = descriptive.avgRange.toFixed(4);
    document.getElementById('variance').textContent = descriptive.variance.toFixed(6);
    document.getElementById('minValue').textContent = descriptive.min.toFixed(4);
    document.getElementById('maxValue').textContent = descriptive.max.toFixed(4);
    document.getElementById('totalRange').textContent = descriptive.range.toFixed(4);
    
    // Affichage des données brutes
    const rawDataTable = document.getElementById('rawDataTable');
    let tableHTML = '<thead><tr><th>Index</th><th>Valeur</th><th>Échantillon</th><th>Mesure</th></tr></thead><tbody>';
    
    let sampleIndex = 1;
    let measureIndex = 1;
    
    descriptive.data.forEach((value, index) => {
        tableHTML += `<tr>
            <td>${index + 1}</td>
            <td>${value.toFixed(4)}</td>
            <td>Échantillon ${sampleIndex}</td>
            <td>Mesure ${measureIndex}</td>
        </tr>`;
        
        measureIndex++;
        if (measureIndex > descriptive.sampleSize) {
            measureIndex = 1;
            sampleIndex++;
        }
    });
    
    tableHTML += '</tbody>';
    rawDataTable.innerHTML = tableHTML;
    
    // Affichage des statistiques par échantillon
    const sampleStatsTable = document.getElementById('sampleStatsTable');
    let statsHTML = '<thead><tr><th>Échantillon</th><th>Taille</th><th>Moyenne</th><th>Étendue</th><th>Écart-type</th><th>Min</th><th>Max</th></tr></thead><tbody>';
    
    descriptive.sampleStats.forEach((stats, index) => {
        statsHTML += `<tr>
            <td>${index + 1}</td>
            <td>${stats.size}</td>
            <td>${stats.mean.toFixed(4)}</td>
            <td>${stats.range.toFixed(4)}</td>
            <td>${stats.std.toFixed(4)}</td>
            <td>${Math.min(...stats.values).toFixed(4)}</td>
            <td>${Math.max(...stats.values).toFixed(4)}</td>
        </tr>`;
    });
    
    statsHTML += '</tbody>';
    sampleStatsTable.innerHTML = statsHTML;
}

// Affichage du test de normalité
function displayNormalityTest() {
    const { normality } = analysisResults;
    
    document.getElementById('shapiroW').textContent = normality.w;
    document.getElementById('criticalValue').textContent = normality.criticalValue;
    document.getElementById('pValue').textContent = normality.pValue;
    document.getElementById('normalityConclusion').textContent = normality.message;
    
    // Interprétation
    const wIntEl = document.getElementById('shapiroWInt');
    const pIntEl = document.getElementById('pValueInt');
    
    if (normality.isNormal) {
        wIntEl.textContent = 'Distribution normale';
        wIntEl.style.color = 'var(--success)';
        pIntEl.textContent = 'Non significatif (p > 0.05)';
        pIntEl.style.color = 'var(--success)';
    } else {
        wIntEl.textContent = 'Distribution non normale';
        wIntEl.style.color = 'var(--accent)';
        pIntEl.textContent = 'Significatif (p ≤ 0.05)';
        pIntEl.style.color = 'var(--accent)';
    }
    
    createNormalityChart();
}

// Affichage de l'analyse de capabilité
function displayCapabilityAnalysis() {
    const { capability } = analysisResults;
    
    document.getElementById('cpResult').textContent = capability.cp;
    document.getElementById('cpkResult').textContent = capability.cpk;
    document.getElementById('cmResult').textContent = capability.cm;
    document.getElementById('cmkResult').textContent = capability.cmk;
    document.getElementById('sigmaIValue').textContent = capability.sigma_i;
    document.getElementById('toleranceRange').textContent = capability.toleranceRange;
    document.getElementById('outOfTolerance').textContent = capability.outOfTolerance + '%';
    document.getElementById('d2Value').textContent = capability.d2;
    
    // Interprétations
    document.getElementById('cpInterpretation').textContent = interpretCp(capability.cp);
    document.getElementById('cpkInterpretation').textContent = interpretCpk(capability.cpk);
    document.getElementById('cmInterpretation').textContent = interpretCp(capability.cm);
    document.getElementById('cmkInterpretation').textContent = interpretCpk(capability.cmk);
    
    createCapabilityChart();
}

// Interprétation Cp
function interpretCp(cp) {
    if (cp >= 1.67) return 'Très capable (niveau 1+)';
    if (cp >= 1.33) return 'Capable (niveau 1)';
    if (cp >= 1.0) return 'Capable marginalement';
    if (cp >= 0.67) return 'Non capable';
    return 'Très non capable';
}

// Interprétation Cpk
function interpretCpk(cpk) {
    if (cpk >= 1.67) return 'Procédé centré et très capable';
    if (cpk >= 1.33) return 'Procédé capable et bien centré';
    if (cpk >= 1.0) return 'Procédé capable marginalement';
    if (cpk >= 0.67) return 'Procédé non capable';
    return 'Procédé très non capable ou non centré';
}

// Affichage des cartes de contrôle
function displayControlCharts() {
    const { controlCharts } = analysisResults;
    
    document.getElementById('xbarUcl').textContent = controlCharts.xbar.ucl.toFixed(4);
    document.getElementById('xbarCenter').textContent = controlCharts.xbar.center.toFixed(4);
    document.getElementById('xbarLcl').textContent = controlCharts.xbar.lcl.toFixed(4);
    document.getElementById('rUcl').textContent = controlCharts.r.ucl.toFixed(4);
    document.getElementById('rCenter').textContent = controlCharts.r.center.toFixed(4);
    document.getElementById('rLcl').textContent = controlCharts.r.lcl.toFixed(4);
    document.getElementById('a2Value').textContent = controlCharts.constants.a2;
    document.getElementById('d3Value').textContent = controlCharts.constants.d3;
    document.getElementById('d4Value').textContent = controlCharts.constants.d4;
    document.getElementById('d2Value').textContent = controlCharts.constants.d2;
    
    createXbarChart();
    createRChart();
}

// Création des graphiques
function createNormalityChart() {
    const ctx = document.getElementById('normalityChart');
    if (!ctx) return;
    
    // Détruire l'ancien graphique
    if (charts.normality) {
        charts.normality.destroy();
    }
    
    const { descriptive } = analysisResults;
    const data = descriptive.data;
    
    // Calcul de l'histogramme
    const histogram = calculateHistogram(data);
    
    charts.normality = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: histogram.labels,
            datasets: [{
                label: 'Distribution observée',
                data: histogram.values,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }, {
                label: 'Courbe normale théorique',
                data: histogram.normalCurve,
                type: 'line',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.4
            }]
        },
        options: getChartOptions('Histogramme de Normalité', 'Valeurs', 'Fréquence')
    });
}

function createCapabilityChart() {
    const ctx = document.getElementById('capabilityChart');
    if (!ctx) return;
    
    if (charts.capability) {
        charts.capability.destroy();
    }
    
    const { descriptive, capability } = analysisResults;
    
    // Données pour la courbe normale
    const curveData = generateNormalCurve(
        descriptive.mean, 
        descriptive.std, 
        capability.ti, 
        capability.ts
    );
    
    charts.capability = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            datasets: [{
                label: 'Distribution du procédé',
                data: curveData,
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                fill: true,
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4
            }]
        },
        options: getCapabilityChartOptions(capability.ti, capability.ts, descriptive.mean)
    });
}

function createXbarChart() {
    const ctx = document.getElementById('xbarChart');
    if (!ctx) return;
    
    if (charts.xbar) {
        charts.xbar.destroy();
    }
    
    const { controlCharts } = analysisResults;
    const sampleCount = controlCharts.xbar.means.length;
    
    charts.xbar = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array.from({length: sampleCount}, (_, i) => `Éch. ${i+1}`),
            datasets: [
                {
                    label: 'Moyennes',
                    data: controlCharts.xbar.means,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                createControlLineDataset('LSC', controlCharts.xbar.ucl, 'rgba(231, 76, 60, 1)'),
                createControlLineDataset('Ligne centrale', controlCharts.xbar.center, 'rgba(46, 204, 113, 1)'),
                createControlLineDataset('LIC', controlCharts.xbar.lcl, 'rgba(231, 76, 60, 1)')
            ]
        },
        options: getControlChartOptions('Carte de Contrôle X-bar', 'Échantillons', 'Moyenne')
    });
}

function createRChart() {
    const ctx = document.getElementById('rChart');
    if (!ctx) return;
    
    if (charts.r) {
        charts.r.destroy();
    }
    
    const { controlCharts } = analysisResults;
    const sampleCount = controlCharts.r.ranges.length;
    
    charts.r = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array.from({length: sampleCount}, (_, i) => `Éch. ${i+1}`),
            datasets: [
                {
                    label: 'Étendues',
                    data: controlCharts.r.ranges,
                    borderColor: 'rgba(155, 89, 182, 1)',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                createControlLineDataset('LSC', controlCharts.r.ucl, 'rgba(231, 76, 60, 1)'),
                createControlLineDataset('Ligne centrale', controlCharts.r.center, 'rgba(46, 204, 113, 1)'),
                createControlLineDataset('LIC', controlCharts.r.lcl, 'rgba(231, 76, 60, 1)')
            ]
        },
        options: getControlChartOptions('Carte de Contrôle R', 'Échantillons', 'Étendue')
    });
}

// Fonctions utilitaires pour les graphiques
function calculateHistogram(data, bins = 10) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const binWidth = range / bins;
    
    const histogram = Array(bins).fill(0);
    const labels = [];
    
    for (let i = 0; i < bins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;
        labels.push(`${binStart.toFixed(2)}`);
    }
    
    data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
        histogram[binIndex]++;
    });
    
    // Courbe normale théorique
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const std = Math.sqrt(data.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (data.length - 1));
    
    const normalCurve = labels.map((_, i) => {
        const binCenter = min + (i + 0.5) * binWidth;
        const pdf = (1 / (std * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-0.5 * Math.pow((binCenter - mean) / std, 2));
        return pdf * data.length * binWidth;
    });
    
    return { labels, values: histogram, normalCurve };
}

function generateNormalCurve(mean, std, ti, ts, points = 100) {
    const range = ts - ti;
    const extendedRange = range * 1.5;
    const start = mean - extendedRange / 2;
    const end = mean + extendedRange / 2;
    const step = (end - start) / points;
    
    const data = [];
    for (let i = 0; i <= points; i++) {
        const x = start + i * step;
        const y = (1 / (std * Math.sqrt(2 * Math.PI))) * 
                 Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        data.push({ x, y: y * 100 });
    }
    
    return data;
}

function createControlLineDataset(label, value, color) {
    return {
        label,
        data: Array(analysisResults.descriptive.sampleCount).fill(value),
        borderColor: color,
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
    };
}

function getChartOptions(title, xLabel, yLabel) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top'
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: yLabel
                }
            },
            x: {
                title: {
                    display: true,
                    text: xLabel
                }
            }
        }
    };
}

function getCapabilityChartOptions(ti, ts, mean) {
    const options = getChartOptions('Analyse de Capabilité', 'Valeurs', 'Densité de probabilité (%)');
    
    options.plugins.annotation = {
        annotations: {
            tiLine: {
                type: 'line',
                xMin: ti,
                xMax: ti,
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                label: {
                    display: true,
                    content: 'TI',
                    position: 'start',
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    color: 'white'
                }
            },
            tsLine: {
                type: 'line',
                xMin: ts,
                xMax: ts,
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                label: {
                    display: true,
                    content: 'TS',
                    position: 'start',
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    color: 'white'
                }
            },
            meanLine: {
                type: 'line',
                xMin: mean,
                xMax: mean,
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 2,
                label: {
                    display: true,
                    content: 'Moyenne',
                    position: 'end',
                    backgroundColor: 'rgba(46, 204, 113, 0.8)',
                    color: 'white'
                }
            }
        }
    };
    
    return options;
}

function getControlChartOptions(title, xLabel, yLabel) {
    const options = getChartOptions(title, xLabel, yLabel);
    options.scales.y.beginAtZero = true;
    return options;
}

// Gestion des onglets
function switchTab(tabId) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet cliqué
    const tabElement = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const contentElement = document.getElementById(`${tabId}Tab`);
    
    if (tabElement && contentElement) {
        tabElement.classList.add('active');
        contentElement.classList.add('active');
    }
}

// Réinitialisation de l'application
function resetApplication() {
    // Réinitialiser les graphiques
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {
        normality: null,
        capability: null,
        xbar: null,
        r: null
    };
    
    // Réinitialiser les données
    dataSamples = [];
    rawData = [];
    analysisResults = {};
    
    // Réinitialiser la configuration
    userSampleConfig = {
        sampleCount: 3,
        sampleSize: 5
    };
    
    // Réinitialiser l'affichage
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('exportBtn').disabled = true;
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('configInfo').innerHTML = '';
    
    // Réinitialiser les valeurs par défaut
    document.getElementById('ts').value = 20.1;
    document.getElementById('ti').value = 19.9;
    document.getElementById('nqa').value = 0.1;
    document.getElementById('dataType').value = 'sample';
    
    // Réinitialiser la zone de saisie
    initializeInputArea();
}

// Exportation des résultats
function exportResults() {
    if (!analysisResults.descriptive) {
        alert('Aucune donnée à exporter. Veuillez d\'abord calculer les statistiques.');
        return;
    }
    
    try {
        // Création du workbook
        const wb = XLSX.utils.book_new();
        
        // Feuille 1: Résumé
        const summaryData = [
            ['CQAS - Rapport d\'Analyse Statistique', '', ''],
            ['Date', new Date().toLocaleDateString('fr-FR'), ''],
            ['Heure', new Date().toLocaleTimeString('fr-FR'), ''],
            ['', '', ''],
            ['CONFIGURATION DE L\'ANALYSE', '', ''],
            ['Mode de saisie', document.getElementById('dataType').value === 'sample' ? 'Par échantillons' : 'Données brutes', ''],
            ['TS (Tolérance Supérieure)', analysisResults.capability.ts, ''],
            ['TI (Tolérance Inférieure)', analysisResults.capability.ti, ''],
            ['NQA', analysisResults.capability.nqa + '%', ''],
            ['', '', ''],
            ['RÉSULTATS STATISTIQUES', 'VALEUR', 'INTERPRÉTATION'],
            ['Nombre total de données', analysisResults.descriptive.n, ''],
            ['Nombre d\'échantillons', analysisResults.descriptive.sampleCount, ''],
            ['Taille des échantillons', analysisResults.descriptive.sampleSize, ''],
            ['Moyenne globale', analysisResults.descriptive.mean.toFixed(4), ''],
            ['Écart-type global', analysisResults.descriptive.std.toFixed(4), ''],
            ['Minimum', analysisResults.descriptive.min.toFixed(4), ''],
            ['Maximum', analysisResults.descriptive.max.toFixed(4), ''],
            ['Étendue totale', analysisResults.descriptive.range.toFixed(4), ''],
            ['', '', ''],
            ['ANALYSE DE CAPABILITÉ', 'VALEUR', 'INTERPRÉTATION'],
            ['Cp (Capabilité du procédé)', analysisResults.capability.cp, interpretCp(analysisResults.capability.cp)],
            ['Cpk (Capabilité centrée)', analysisResults.capability.cpk, interpretCpk(analysisResults.capability.cpk)],
            ['Cm (Capabilité machine)', analysisResults.capability.cm, interpretCp(analysisResults.capability.cm)],
            ['Cmk (Capabilité machine centrée)', analysisResults.capability.cmk, interpretCpk(analysisResults.capability.cmk)],
            ['Sigma_i (variation intra-échantillon)', analysisResults.capability.sigma_i, ''],
            ['% hors tolérance estimé', analysisResults.capability.outOfTolerance + '%', ''],
            ['', '', ''],
            ['TEST DE NORMALITÉ', 'VALEUR', 'INTERPRÉTATION'],
            ['Statistique W (Shapiro-Wilk)', analysisResults.normality.w, ''],
            ['Valeur critique (5%)', analysisResults.normality.criticalValue, ''],
            ['Valeur p', analysisResults.normality.pValue, ''],
            ['Conclusion', analysisResults.normality.message, analysisResults.normality.isNormal ? 'Normal' : 'Non normal']
        ];
        
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
        
        // Feuille 2: Données brutes
        const rawDataSheet = [
            ['INDEX', 'VALEUR', 'ÉCHANTILLON', 'MESURE'],
            ...analysisResults.descriptive.data.map((value, index) => {
                const sampleIndex = Math.floor(index / analysisResults.descriptive.sampleSize) + 1;
                const measureIndex = (index % analysisResults.descriptive.sampleSize) + 1;
                return [index + 1, value, `Éch. ${sampleIndex}`, `M${measureIndex}`];
            })
        ];
        
        const wsRawData = XLSX.utils.aoa_to_sheet(rawDataSheet);
        XLSX.utils.book_append_sheet(wb, wsRawData, 'Données brutes');
        
        // Feuille 3: Statistiques par échantillon
        const sampleStats = [
            ['ÉCHANTILLON', 'TAILLE', 'MOYENNE', 'ÉTENDUE', 'ÉCART-TYPE', 'MIN', 'MAX'],
            ...analysisResults.descriptive.sampleStats.map((stats, index) => [
                `Éch. ${index + 1}`,
                stats.size,
                stats.mean.toFixed(4),
                stats.range.toFixed(4),
                stats.std.toFixed(4),
                Math.min(...stats.values).toFixed(4),
                Math.max(...stats.values).toFixed(4)
            ])
        ];
        
        const wsSampleStats = XLSX.utils.aoa_to_sheet(sampleStats);
        XLSX.utils.book_append_sheet(wb, wsSampleStats, 'Statistiques échantillons');
        
        // Feuille 4: Limites de contrôle
        const controlLimits = [
            ['CARTE DE CONTRÔLE X-bar', 'VALEUR'],
            ['LSC (Limite Supérieure de Contrôle)', analysisResults.controlCharts.xbar.ucl.toFixed(4)],
            ['Ligne centrale', analysisResults.controlCharts.xbar.center.toFixed(4)],
            ['LIC (Limite Inférieure de Contrôle)', analysisResults.controlCharts.xbar.lcl.toFixed(4)],
            ['', ''],
            ['CARTE DE CONTRÔLE R', 'VALEUR'],
            ['LSC (Limite Supérieure de Contrôle)', analysisResults.controlCharts.r.ucl.toFixed(4)],
            ['Ligne centrale', analysisResults.controlCharts.r.center.toFixed(4)],
            ['LIC (Limite Inférieure de Contrôle)', analysisResults.controlCharts.r.lcl.toFixed(4)],
            ['', ''],
            ['CONSTANTES STATISTIQUES', 'VALEUR'],
            ['A2 (pour X-bar)', analysisResults.controlCharts.constants.a2],
            ['D3 (pour R)', analysisResults.controlCharts.constants.d3],
            ['D4 (pour R)', analysisResults.controlCharts.constants.d4],
            ['d2 (pour sigma_i)', analysisResults.controlCharts.constants.d2]
        ];
        
        const wsControlLimits = XLSX.utils.aoa_to_sheet(controlLimits);
        XLSX.utils.book_append_sheet(wb, wsControlLimits, 'Limites de contrôle');
        
        // Générer le nom de fichier
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = new Date().toISOString().slice(11, 19).replace(/:/g, '');
        const fileName = `CQAS_Analyse_${dateStr}_${timeStr}.xlsx`;
        
        // Télécharger le fichier
        XLSX.writeFile(wb, fileName);
        
        // Confirmation
        alert(`Rapport exporté avec succès sous le nom : ${fileName}`);
        
    } catch (error) {
        console.error('Erreur lors de l\'exportation:', error);
        alert('Une erreur est survenue lors de l\'exportation.');
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', initializeApp);