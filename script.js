// Variables globales
let dataSamples = [];
let rawData = [];
let analysisResults = {};
let charts = {
    normality: null,
    capability: null,
    xbar: null,
    r: null
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeInputArea();
    setupEventListeners();
});

// Initialise la zone de saisie selon le type choisi
function initializeInputArea() {
    const dataType = document.getElementById('dataType').value;
    const inputArea = document.getElementById('inputArea');
    
    if (dataType === 'sample') {
        inputArea.innerHTML = `
            <div class="form-group">
                <label for="sampleCount">Nombre d'échantillons (k) :</label>
                <input type="number" id="sampleCount" min="2" max="10" value="3">
                <span class="help-text">Maximum 10 échantillons (n*k ≤ 50)</span>
            </div>
            
            <div class="form-group">
                <label for="sampleSize">Taille des échantillons (n) :</label>
                <input type="number" id="sampleSize" min="2" max="25" value="5">
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
        
        // Écouteurs pour la mise à jour du tableau
        document.getElementById('sampleCount').addEventListener('change', generateSampleTable);
        document.getElementById('sampleSize').addEventListener('change', generateSampleTable);
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

// Génère le tableau de saisie pour les échantillons
function generateSampleTable() {
    const sampleCount = parseInt(document.getElementById('sampleCount').value) || 3;
    const sampleSize = parseInt(document.getElementById('sampleSize').value) || 5;
    const tableContainer = document.getElementById('sampleDataTable');
    
    let tableHTML = '<table>';
    
    // En-tête
    tableHTML += '<tr><th>Échantillon</th>';
    for (let i = 1; i <= sampleSize; i++) {
        tableHTML += `<th>Mesure ${i}</th>`;
    }
    tableHTML += '</tr>';
    
    // Lignes de données
    for (let i = 1; i <= sampleCount; i++) {
        tableHTML += `<tr><td>Éch. ${i}</td>`;
        for (let j = 1; j <= sampleSize; j++) {
            tableHTML += `<td><input type="number" step="0.001" id="sample-${i}-${j}" value="${19.9 + Math.random() * 0.2}"></td>`;
        }
        tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    tableContainer.innerHTML = tableHTML;
}

// Configure les écouteurs d'événements
function setupEventListeners() {
    document.getElementById('dataType').addEventListener('change', initializeInputArea);
    document.getElementById('calculateBtn').addEventListener('click', calculateStatistics);
    document.getElementById('resetBtn').addEventListener('click', resetApplication);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
    
    // Gestion des onglets
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Désactiver tous les onglets
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Activer l'onglet cliqué
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Réinitialise l'application
function resetApplication() {
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('exportBtn').disabled = true;
    initializeInputArea();
    
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
}

// Calcule toutes les statistiques
function calculateStatistics() {
    // Afficher l'indicateur de chargement
    document.getElementById('loadingIndicator').style.display = 'block';
    
    // Simuler un délai de calcul
    setTimeout(() => {
        // Récupérer les données selon le type choisi
        const dataType = document.getElementById('dataType').value;
        
        if (dataType === 'sample') {
            dataSamples = getSampleData();
            rawData = flattenSamples(dataSamples);
        } else {
            rawData = getRawData();
            dataSamples = groupIntoSamples(rawData);
        }
        
        // Vérifier que nous avons des données
        if (rawData.length === 0) {
            alert('Veuillez saisir des données valides.');
            document.getElementById('loadingIndicator').style.display = 'none';
            return;
        }
        
        // Calculer les statistiques
        analysisResults = {
            descriptive: calculateDescriptiveStats(rawData, dataSamples),
            normality: performShapiroWilkTest(rawData),
            capability: calculateCapabilityIndices(rawData, dataSamples),
            controlCharts: calculateControlLimits(dataSamples)
        };
        
        // Afficher les résultats
        displayResults();
        
        // Masquer l'indicateur de chargement et afficher les résultats
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('exportBtn').disabled = false;
    }, 1000);
}

// Récupère les données d'échantillons
function getSampleData() {
    const sampleCount = parseInt(document.getElementById('sampleCount').value);
    const sampleSize = parseInt(document.getElementById('sampleSize').value);
    const samples = [];
    
    for (let i = 1; i <= sampleCount; i++) {
        const sample = [];
        for (let j = 1; j <= sampleSize; j++) {
            const value = parseFloat(document.getElementById(`sample-${i}-${j}`).value);
            if (!isNaN(value)) {
                sample.push(value);
            }
        }
        if (sample.length > 0) {
            samples.push(sample);
        }
    }
    
    return samples;
}

// Récupère les données brutes
function getRawData() {
    const rawDataString = document.getElementById('rawData').value;
    return rawDataString.split(',')
        .map(val => parseFloat(val.trim()))
        .filter(val => !isNaN(val));
}

// Aplatit les échantillons en une seule liste
function flattenSamples(samples) {
    return samples.reduce((acc, sample) => acc.concat(sample), []);
}

// Regroupe les données brutes en échantillons
function groupIntoSamples(data) {
    // Déterminer la taille d'échantillon optimale (environ 5)
    const sampleSize = Math.min(5, Math.floor(data.length / 3));
    if (sampleSize < 2) return [data]; // Si pas assez de données, un seul échantillon
    
    const samples = [];
    for (let i = 0; i < data.length; i += sampleSize) {
        samples.push(data.slice(i, i + sampleSize));
    }
    
    return samples;
}

// Calcule les statistiques descriptives
function calculateDescriptiveStats(data, samples) {
    const n = data.length;
    const mean = data.reduce((sum, val) => sum + val, 0) / n;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);
    
    // Calcul des moyennes et étendues par échantillon
    const sampleMeans = samples.map(sample => 
        sample.reduce((sum, val) => sum + val, 0) / sample.length
    );
    
    const sampleRanges = samples.map(sample => 
        Math.max(...sample) - Math.min(...sample)
    );
    
    const avgRange = sampleRanges.reduce((sum, range) => sum + range, 0) / samples.length;
    
    return {
        n,
        mean,
        variance,
        std,
        sampleCount: samples.length,
        sampleSize: samples[0] ? samples[0].length : 0,
        sampleMeans,
        sampleRanges,
        avgRange,
        min: Math.min(...data),
        max: Math.max(...data),
        range: Math.max(...data) - Math.min(...data),
        data: data
    };
}

// Effectue le test de Shapiro-Wilk
function performShapiroWilkTest(data) {
    // Implémentation simplifiée du test de Shapiro-Wilk
    // En pratique, on utiliserait une bibliothèque statistique complète
    
    const n = data.length;
    if (n < 3 || n > 50) {
        return {
            w: 0,
            criticalValue: 0,
            isNormal: false,
            message: "Le test de Shapiro-Wilk nécessite entre 3 et 50 données."
        };
    }
    
    // Données triées
    const sortedData = [...data].sort((a, b) => a - b);
    
    // Coefficients pour le test (valeurs approximatives)
    // En pratique, on utiliserait une table complète
    const coefficients = getShapiroCoefficients(n);
    
    // Calcul de la statistique W
    let numerator = 0;
    for (let i = 0; i < Math.floor(n/2); i++) {
        numerator += coefficients[i] * (sortedData[n-1-i] - sortedData[i]);
    }
    
    const denominator = data.reduce((sum, val) => {
        const diff = val - data.reduce((s, v) => s + v, 0) / n;
        return sum + diff * diff;
    }, 0);
    
    const w = Math.pow(numerator, 2) / denominator;
    
    // Valeur critique pour alpha = 0.05 (approximative)
    const criticalValue = getCriticalValue(n);
    
    return {
        w: Math.round(w * 1000) / 1000,
        criticalValue: Math.round(criticalValue * 1000) / 1000,
        isNormal: w > criticalValue,
        message: w > criticalValue ? 
            "La distribution est normale (au seuil de 5%)" : 
            "La distribution n'est pas normale (au seuil de 5%)"
    };
}

// Coefficients approximatifs pour Shapiro-Wilk
function getShapiroCoefficients(n) {
    // Table simplifiée - en pratique, on utiliserait une table complète
    const coefficients = {
        3: [0.7071],
        4: [0.6872, 0.1677],
        5: [0.6646, 0.2413],
        6: [0.6431, 0.2806, 0.0875],
        7: [0.6233, 0.3031, 0.1401],
        8: [0.6052, 0.3164, 0.1743, 0.0561],
        9: [0.5888, 0.3244, 0.1976, 0.0947],
        10: [0.5739, 0.3291, 0.2141, 0.1224, 0.0399]
    };
    
    return coefficients[n] || Array(Math.floor(n/2)).fill(0.5);
}

// Valeur critique approximative pour Shapiro-Wilk
function getCriticalValue(n) {
    // Valeurs critiques approximatives pour alpha = 0.05
    const criticalValues = {
        3: 0.767, 4: 0.748, 5: 0.762, 6: 0.788, 7: 0.803,
        8: 0.818, 9: 0.829, 10: 0.842, 15: 0.881, 20: 0.905,
        25: 0.918, 30: 0.927, 40: 0.941, 50: 0.947
    };
    
    // Approximation linéaire pour n entre les valeurs connues
    const knownN = Object.keys(criticalValues).map(Number).sort((a, b) => a - b);
    if (n <= knownN[0]) return criticalValues[knownN[0]];
    if (n >= knownN[knownN.length-1]) return criticalValues[knownN[knownN.length-1]];
    
    for (let i = 0; i < knownN.length - 1; i++) {
        if (n >= knownN[i] && n <= knownN[i+1]) {
            const t = (n - knownN[i]) / (knownN[i+1] - knownN[i]);
            return criticalValues[knownN[i]] + t * (criticalValues[knownN[i+1]] - criticalValues[knownN[i]]);
        }
    }
    
    return 0.9; // Valeur par défaut
}

// Calcule les indices de capabilité
function calculateCapabilityIndices(data, samples) {
    const ts = parseFloat(document.getElementById('ts').value);
    const ti = parseFloat(document.getElementById('ti').value);
    const nqa = parseFloat(document.getElementById('nqa').value);
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const std = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1));
    
    // Calcul de sigma_i à partir de l'étendue moyenne
    const sampleRanges = samples.map(sample => Math.max(...sample) - Math.min(...sample));
    const avgRange = sampleRanges.reduce((sum, range) => sum + range, 0) / samples.length;
    
    // Constante d2 selon la taille d'échantillon
    const sampleSize = samples[0] ? samples[0].length : 0;
    const d2 = getD2Constant(sampleSize);
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
    
    return {
        cp: Math.round(cp * 1000) / 1000,
        cpk: Math.round(cpk * 1000) / 1000,
        cm: Math.round(cm * 1000) / 1000,
        cmk: Math.round(cmk * 1000) / 1000,
        ts,
        ti,
        nqa,
        sigma_i: Math.round(sigma_i * 1000) / 1000
    };
}

// Constante d2 pour le calcul de sigma_i
function getD2Constant(sampleSize) {
    const d2Values = {
        2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326,
        6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078
    };
    return d2Values[sampleSize] || 1.0;
}

// Calcule les limites de contrôle
function calculateControlLimits(samples) {
    const sampleMeans = samples.map(sample => 
        sample.reduce((sum, val) => sum + val, 0) / sample.length
    );
    
    const sampleRanges = samples.map(sample => 
        Math.max(...sample) - Math.min(...sample)
    );
    
    const overallMean = sampleMeans.reduce((sum, mean) => sum + mean, 0) / samples.length;
    const avgRange = sampleRanges.reduce((sum, range) => sum + range, 0) / samples.length;
    
    // Constantes pour les cartes de contrôle
    const sampleSize = samples[0] ? samples[0].length : 0;
    const a2 = getA2Constant(sampleSize);
    const d3 = getD3Constant(sampleSize);
    const d4 = getD4Constant(sampleSize);
    
    // Limites pour la carte X-bar
    const xbarUCL = overallMean + a2 * avgRange;
    const xbarLCL = overallMean - a2 * avgRange;
    
    // Limites pour la carte R
    const rUCL = d4 * avgRange;
    const rLCL = d3 * avgRange;
    
    return {
        xbar: {
            means: sampleMeans,
            ucl: xbarUCL,
            lcl: xbarLCL,
            center: overallMean
        },
        r: {
            ranges: sampleRanges,
            ucl: rUCL,
            lcl: rLCL,
            center: avgRange
        },
        constants: { a2, d3, d4 }
    };
}

// Constante A2 pour les cartes de contrôle
function getA2Constant(sampleSize) {
    const a2Values = {
        2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577,
        6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308
    };
    return a2Values[sampleSize] || 0.0;
}

// Constante D3 pour les cartes de contrôle
function getD3Constant(sampleSize) {
    const d3Values = {
        2: 0, 3: 0, 4: 0, 5: 0,
        6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223
    };
    return d3Values[sampleSize] || 0.0;
}

// Constante D4 pour les cartes de contrôle
function getD4Constant(sampleSize) {
    const d4Values = {
        2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114,
        6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777
    };
    return d4Values[sampleSize] || 0.0;
}

// Affiche tous les résultats
function displayResults() {
    displaySummary();
    displayDescriptiveStats();
    displayNormalityTest();
    displayCapabilityAnalysis();
    displayControlCharts();
}

// Affiche le résumé
function displaySummary() {
    document.getElementById('meanValue').textContent = analysisResults.descriptive.mean.toFixed(4);
    document.getElementById('stdValue').textContent = analysisResults.descriptive.std.toFixed(4);
    document.getElementById('cpValue').textContent = analysisResults.capability.cp;
    document.getElementById('cpkValue').textContent = analysisResults.capability.cpk;
    
    // Conclusion générale
    const conclusionEl = document.getElementById('conclusion');
    let conclusionClass = 'conclusion';
    let conclusionText = '';
    
    if (analysisResults.normality.isNormal && analysisResults.capability.cpk >= 1.33) {
        conclusionClass += ' success';
        conclusionText = '✅ Le procédé est sous contrôle statistique et capable. La distribution est normale et les indices de capabilité sont satisfaisants.';
    } else if (analysisResults.normality.isNormal && analysisResults.capability.cpk >= 1.0) {
        conclusionClass += ' warning';
        conclusionText = '⚠️ Le procédé est sous contrôle mais nécessite une surveillance. La distribution est normale mais la capabilité est marginale.';
    } else {
        conclusionClass += ' error';
        conclusionText = '❌ Le procédé nécessite des actions correctives. Vérifiez la normalité de la distribution et/ou la capabilité du procédé.';
    }
    
    conclusionEl.className = conclusionClass;
    conclusionEl.innerHTML = `<h3>Conclusion</h3><p>${conclusionText}</p>`;
}

// Affiche les statistiques descriptives
function displayDescriptiveStats() {
    document.getElementById('sampleCount').textContent = analysisResults.descriptive.sampleCount;
    document.getElementById('sampleSize').textContent = analysisResults.descriptive.sampleSize;
    document.getElementById('globalMean').textContent = analysisResults.descriptive.mean.toFixed(4);
    document.getElementById('globalStd').textContent = analysisResults.descriptive.std.toFixed(4);
    document.getElementById('avgRange').textContent = analysisResults.descriptive.avgRange.toFixed(4);
    document.getElementById('variance').textContent = analysisResults.descriptive.variance.toFixed(6);
    
    // Afficher les données brutes
    const rawDataTable = document.getElementById('rawDataTable');
    let tableHTML = '<tr><th>Index</th><th>Valeur</th></tr>';
    
    analysisResults.descriptive.data.forEach((value, index) => {
        tableHTML += `<tr><td>${index + 1}</td><td>${value.toFixed(4)}</td></tr>`;
    });
    
    rawDataTable.innerHTML = tableHTML;
}

// Affiche les résultats du test de normalité
function displayNormalityTest() {
    document.getElementById('shapiroW').textContent = analysisResults.normality.w;
    document.getElementById('criticalValue').textContent = analysisResults.normality.criticalValue;
    document.getElementById('normalityConclusion').textContent = analysisResults.normality.message;
    
    // Interprétation de W
    const wIntEl = document.getElementById('shapiroWInt');
    if (analysisResults.normality.w > analysisResults.normality.criticalValue) {
        wIntEl.textContent = 'W > Wcrit → Distribution normale';
        wIntEl.style.color = 'green';
    } else {
        wIntEl.textContent = 'W ≤ Wcrit → Distribution non normale';
        wIntEl.style.color = 'red';
    }
    
    // Graphique de normalité
    createNormalityChart();
}

// Affiche l'analyse de capabilité
function displayCapabilityAnalysis() {
    document.getElementById('cpResult').textContent = analysisResults.capability.cp;
    document.getElementById('cpkResult').textContent = analysisResults.capability.cpk;
    document.getElementById('cmResult').textContent = analysisResults.capability.cm;
    document.getElementById('cmkResult').textContent = analysisResults.capability.cmk;
    
    // Interprétations
    document.getElementById('cpInterpretation').textContent = interpretCp(analysisResults.capability.cp);
    document.getElementById('cpkInterpretation').textContent = interpretCpk(analysisResults.capability.cpk);
    document.getElementById('cmInterpretation').textContent = interpretCp(analysisResults.capability.cm);
    document.getElementById('cmkInterpretation').textContent = interpretCpk(analysisResults.capability.cmk);
    
    // Graphique de capabilité
    createCapabilityChart();
}

// Interprète la valeur de Cp
function interpretCp(cp) {
    if (cp >= 1.67) return 'Très capable';
    if (cp >= 1.33) return 'Capable';
    if (cp >= 1.0) return 'Capable marginalement';
    return 'Non capable';
}

// Interprète la valeur de Cpk
function interpretCpk(cpk) {
    if (cpk >= 1.67) return 'Procédé centré et très capable';
    if (cpk >= 1.33) return 'Procédé capable';
    if (cpk >= 1.0) return 'Procédé capable marginalement';
    return 'Procédé non capable ou non centré';
}

// Affiche les cartes de contrôle
function displayControlCharts() {
    document.getElementById('xbarUcl').textContent = analysisResults.controlCharts.xbar.ucl.toFixed(4);
    document.getElementById('xbarCenter').textContent = analysisResults.controlCharts.xbar.center.toFixed(4);
    document.getElementById('xbarLcl').textContent = analysisResults.controlCharts.xbar.lcl.toFixed(4);
    document.getElementById('rUcl').textContent = analysisResults.controlCharts.r.ucl.toFixed(4);
    document.getElementById('rCenter').textContent = analysisResults.controlCharts.r.center.toFixed(4);
    document.getElementById('rLcl').textContent = analysisResults.controlCharts.r.lcl.toFixed(4);
    
    createXbarChart();
    createRChart();
}

// Crée le graphique de normalité
function createNormalityChart() {
    const ctx = document.getElementById('normalityChart').getContext('2d');
    
    // Détruire le graphique existant
    if (charts.normality) charts.normality.destroy();
    
    // Données pour l'histogramme
    const data = rawData;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const binCount = Math.min(10, Math.ceil(Math.sqrt(data.length)));
    const binSize = range / binCount;
    
    // Calcul des fréquences
    const bins = Array(binCount).fill(0);
    data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        bins[binIndex]++;
    });
    
    // Courbe normale théorique
    const mean = analysisResults.descriptive.mean;
    const std = analysisResults.descriptive.std;
    const normalCurve = [];
    const step = range / 50;
    for (let x = min - range * 0.1; x <= max + range * 0.1; x += step) {
        const y = (1 / (std * Math.sqrt(2 * Math.PI))) * 
                 Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        normalCurve.push({x, y: y * data.length * binSize});
    }
    
    charts.normality = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: binCount}, (_, i) => 
                (min + i * binSize).toFixed(2) + ' - ' + (min + (i+1) * binSize).toFixed(2)
            ),
            datasets: [
                {
                    label: 'Distribution observée',
                    data: bins,
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Distribution normale théorique',
                    data: normalCurve.map(point => point.y),
                    type: 'line',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Fréquence'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Valeurs'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Test de Normalité - Histogramme vs Courbe Normale'
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Crée le graphique de capabilité
function createCapabilityChart() {
    const ctx = document.getElementById('capabilityChart').getContext('2d');
    const ts = analysisResults.capability.ts;
    const ti = analysisResults.capability.ti;
    const mean = analysisResults.descriptive.mean;
    const std = analysisResults.descriptive.std;
    
    // Détruire le graphique existant
    if (charts.capability) charts.capability.destroy();
    
    // Données pour la courbe normale
    const curveData = [];
    const range = ts - ti;
    const step = range / 100;
    
    for (let x = ti - range * 0.2; x <= ts + range * 0.2; x += step) {
        const y = (1 / (std * Math.sqrt(2 * Math.PI))) * 
                 Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        curveData.push({x, y});
    }
    
    charts.capability = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Distribution du procédé',
                    data: curveData.map(point => ({x: point.x, y: point.y * 100})),
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: ti - range * 0.2,
                    max: ts + range * 0.2,
                    title: {
                        display: true,
                        text: 'Valeurs'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Densité de probabilité (%)'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Analyse de Capabilité - Distribution vs Spécifications'
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            xMin: ti,
                            xMax: ti,
                            borderColor: 'rgba(231, 76, 60, 1)',
                            borderWidth: 2,
                            label: {
                                display: true,
                                content: 'TI',
                                position: 'start'
                            }
                        },
                        line2: {
                            type: 'line',
                            xMin: ts,
                            xMax: ts,
                            borderColor: 'rgba(231, 76, 60, 1)',
                            borderWidth: 2,
                            label: {
                                display: true,
                                content: 'TS',
                                position: 'start'
                            }
                        },
                        line3: {
                            type: 'line',
                            xMin: mean,
                            xMax: mean,
                            borderColor: 'rgba(46, 204, 113, 1)',
                            borderWidth: 2,
                            label: {
                                display: true,
                                content: 'Moyenne',
                                position: 'end'
                            }
                        }
                    }
                }
            }
        }
    });
}

// Crée la carte de contrôle X-bar
function createXbarChart() {
    const ctx = document.getElementById('xbarChart').getContext('2d');
    const xbarData = analysisResults.controlCharts.xbar;
    
    // Détruire le graphique existant
    if (charts.xbar) charts.xbar.destroy();
    
    charts.xbar = new Chart(ctx, {
        type: 'line',
        data: {
            labels: xbarData.means.map((_, i) => `Éch. ${i+1}`),
            datasets: [
                {
                    label: 'Moyennes des échantillons',
                    data: xbarData.means,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'LSC',
                    data: Array(xbarData.means.length).fill(xbarData.ucl),
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Ligne centrale',
                    data: Array(xbarData.means.length).fill(xbarData.center),
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'LIC',
                    data: Array(xbarData.means.length).fill(xbarData.lcl),
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Moyenne'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Échantillons'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Carte de Contrôle X-bar (Moyennes)'
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Crée la carte de contrôle R
function createRChart() {
    const ctx = document.getElementById('rChart').getContext('2d');
    const rData = analysisResults.controlCharts.r;
    
    // Détruire le graphique existant
    if (charts.r) charts.r.destroy();
    
    charts.r = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rData.ranges.map((_, i) => `Éch. ${i+1}`),
            datasets: [
                {
                    label: 'Étendues des échantillons',
                    data: rData.ranges,
                    borderColor: 'rgba(155, 89, 182, 1)',
                    backgroundColor: 'rgba(155, 89, 182, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'LSC',
                    data: Array(rData.ranges.length).fill(rData.ucl),
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Ligne centrale',
                    data: Array(rData.ranges.length).fill(rData.center),
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'LIC',
                    data: Array(rData.ranges.length).fill(rData.lcl),
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Étendue'
                    },
                    beginAtZero: true
                },
                x: {
                    title: {
                        display: true,
                        text: 'Échantillons'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Carte de Contrôle R (Étendues)'
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Exporte les résultats en différents formats
function exportResults() {
    // Créer un workbook Excel
    const wb = XLSX.utils.book_new();
    
    // Feuille 1: Résumé
    const summaryData = [
        ['Paramètre', 'Valeur'],
        ['Moyenne', analysisResults.descriptive.mean.toFixed(4)],
        ['Écart-type', analysisResults.descriptive.std.toFixed(4)],
        ['Cp', analysisResults.capability.cp],
        ['Cpk', analysisResults.capability.cpk],
        ['Cm', analysisResults.capability.cm],
        ['Cmk', analysisResults.capability.cmk],
        ['Statistique W (Shapiro-Wilk)', analysisResults.normality.w],
        ['Valeur critique (5%)', analysisResults.normality.criticalValue],
        ['Conclusion normalité', analysisResults.normality.message]
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
    
    // Feuille 2: Données brutes
    const rawDataSheet = [
        ['Index', 'Valeur'],
        ...analysisResults.descriptive.data.map((value, index) => [index + 1, value])
    ];
    
    const wsRawData = XLSX.utils.aoa_to_sheet(rawDataSheet);
    XLSX.utils.book_append_sheet(wb, wsRawData, 'Données brutes');
    
    // Feuille 3: Statistiques par échantillon
    const sampleStats = [
        ['Échantillon', 'Moyenne', 'Étendue'],
        ...analysisResults.controlCharts.xbar.means.map((mean, index) => [
            `Éch. ${index + 1}`,
            mean,
            analysisResults.controlCharts.r.ranges[index]
        ])
    ];
    
    const wsSampleStats = XLSX.utils.aoa_to_sheet(sampleStats);
    XLSX.utils.book_append_sheet(wb, wsSampleStats, 'Statistiques échantillons');
    
    // Feuille 4: Limites de contrôle
    const controlLimits = [
        ['Paramètre', 'Valeur'],
        ['LSC X-bar', analysisResults.controlCharts.xbar.ucl.toFixed(4)],
        ['Ligne centrale X-bar', analysisResults.controlCharts.xbar.center.toFixed(4)],
        ['LIC X-bar', analysisResults.controlCharts.xbar.lcl.toFixed(4)],
        ['LSC R', analysisResults.controlCharts.r.ucl.toFixed(4)],
        ['Ligne centrale R', analysisResults.controlCharts.r.center.toFixed(4)],
        ['LIC R', analysisResults.controlCharts.r.lcl.toFixed(4)]
    ];
    
    const wsControlLimits = XLSX.utils.aoa_to_sheet(controlLimits);
    XLSX.utils.book_append_sheet(wb, wsControlLimits, 'Limites de contrôle');
    
    // Générer le fichier Excel
    const fileName = `CQAS_Analyse_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Exporter également en CSV pour les données brutes
    exportToCSV();
}

// Exporte les données en CSV
function exportToCSV() {
    // Créer le contenu CSV
    let csvContent = "Index,Valeur\n";
    
    analysisResults.descriptive.data.forEach((value, index) => {
        csvContent += `${index + 1},${value}\n`;
    });
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CQAS_Donnees_brutes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

