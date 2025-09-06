"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
// Environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
// Only log essential info, not every request
if (!DEEPSEEK_API_KEY) {
    console.log('⚠️ DeepSeek API key not configured, using local analysis fallback');
}
// Local analysis fallback when DeepSeek is unavailable
const generateLocalAnalysis = (data) => {
    const { metrics } = data;
    const insights = [];
    const recommendations = [];
    const trends = [];
    // Generate insights based on metrics
    if (metrics.completionRate > 0.8) {
        insights.push('Eccellente gestione dei progetti! Alto tasso di completamento rapporti indica forte efficienza del team e ottimizzazione dei flussi di lavoro');
    }
    else if (metrics.completionRate > 0.6) {
        insights.push('Buon progresso sui rapporti, ma c\'è spazio per migliorare il follow-through dei progetti e il monitoraggio del completamento');
    }
    else {
        insights.push('Tasso di completamento moderato suggerisce potenziali colli di bottiglia nei flussi di lavoro o problemi di allocazione delle risorse');
    }
    if (metrics.activeWorksitesRatio > 0.7) {
        insights.push('Forte utilizzo dei cantieri mostra attività aziendale sana e pipeline di progetti solida');
    }
    else {
        insights.push('Utilizzo dei cantieri più basso può indicare pattern stagionali o opportunità per aumentare il volume dei progetti');
    }
    if (metrics.adminRatio > 0.3) {
        insights.push('Buon rapporto admin-utente per la gestione del sistema');
    }
    // Generate recommendations
    if (metrics.completionRate < 0.8) {
        recommendations.push('Implementare flussi di lavoro di tracciamento progetti per migliorare i tassi di completamento rapporti');
    }
    if (metrics.totalProducts < 100) {
        recommendations.push('Considerare l\'espansione del catalogo prodotti per aumentare le offerte di servizi');
    }
    // Generate trends
    trends.push('L\'azienda sembra essere in una fase di crescita attiva');
    trends.push('Buon equilibrio tra cantieri attivi e inattivi');
    return {
        insights: insights.length > 0 ? insights : ['I dati del dashboard mostrano operazioni aziendali consistenti'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continuare a monitorare le metriche chiave per le opportunità di ottimizzazione'],
        trends: trends.length > 0 ? trends : ['Prestazioni aziendali costanti con potenziale di crescita'],
        summary: 'Il dashboard mostra metriche aziendali sane con spazio per l\'ottimizzazione nel completamento dei rapporti e nell\'espansione dei prodotti.',
        source: 'local'
    };
};
// Test endpoint to verify DeepSeek API connectivity
router.get('/test-deepseek', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!DEEPSEEK_API_KEY) {
        return res.json({
            status: 'error',
            message: 'No DeepSeek API key configured',
            source: 'local'
        });
    }
    try {
        console.log('🧪 Testing DeepSeek API connectivity...');
        const response = yield axios_1.default.post(DEEPSEEK_API_URL, {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: 'Rispondi solo con "OK"'
                }
            ],
            max_tokens: 10,
            temperature: 0
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        const aiResponse = (_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        console.log('✅ DeepSeek API test successful:', aiResponse);
        res.json({
            status: 'success',
            message: 'DeepSeek API is working',
            response: aiResponse,
            source: 'deepseek'
        });
    }
    catch (error) {
        console.error('❌ DeepSeek API test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.json({
            status: 'error',
            message: 'DeepSeek API test failed',
            error: error.message,
            source: 'local'
        });
    }
}));
// AI-powered dashboard analysis endpoint
router.post('/analyze-dashboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const dashboardData = req.body;
        // Check if DeepSeek API is available
        if (!DEEPSEEK_API_KEY) {
            const localAnalysis = generateLocalAnalysis(dashboardData);
            return res.json(localAnalysis);
        }
        // Prepare concise prompt for DeepSeek
        const prompt = `Analizza questi dati del dashboard aziendale e fornisci:

1. **Approfondimenti Chiave** (3-4 punti): Analisi dei dati più significativi
2. **Raccomandazioni** (2-3 punti): Suggerimenti per migliorare le performance  
3. **Tendenze Aziendali** (2-3 punti): Pattern e direzioni identificati
4. **Riepilogo Esecutivo**: Sintesi in 1-2 frasi

Dati del Dashboard:
- Clienti: ${dashboardData.metrics.totalClients}
- Utenti: ${dashboardData.metrics.totalUsers} (Admin: ${Math.round(dashboardData.metrics.adminRatio * 100)}%)
- Prodotti: ${dashboardData.metrics.totalProducts}
- Prezzo Medio: €${dashboardData.metrics.averageProductPrice.toFixed(2)}
- Cantieri: ${dashboardData.metrics.totalWorksites} (Attivi: ${Math.round(dashboardData.metrics.activeWorksitesRatio * 100)}%)
- Rapporti: ${dashboardData.metrics.totalReports}
- Completamento: ${Math.round(dashboardData.metrics.completionRate * 100)}%

Rispondi in italiano, in formato JSON:
{
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "trends": ["trend1", "trend2"],
  "summary": "riepilogo"
}`;
        // Simple retry mechanism
        let lastError;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`🔄 Attempting DeepSeek API call (attempt ${attempt}/2)...`);
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'Sei un analista aziendale esperto. Analizza i dati forniti e fornisci insights professionali e raccomandazioni concrete in italiano.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                };
                console.log(`📤 Request payload size: ${JSON.stringify(requestData).length} characters`);
                const response = yield axios_1.default.post(DEEPSEEK_API_URL, requestData, {
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000, // 30 second timeout
                });
                console.log(`✅ DeepSeek API response received (status: ${response.status})`);
                const aiResponse = (_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (aiResponse) {
                    console.log(`📝 AI Response length: ${aiResponse.length} characters`);
                    try {
                        // Try to parse the AI response as JSON
                        const parsedResponse = JSON.parse(aiResponse);
                        // Validate the response structure
                        if (parsedResponse.insights && parsedResponse.recommendations &&
                            parsedResponse.trends && parsedResponse.summary) {
                            console.log(`🎯 DeepSeek analysis successful, returning AI insights`);
                            return res.json(Object.assign(Object.assign({}, parsedResponse), { source: 'deepseek' }));
                        }
                        else {
                            console.log(`⚠️ DeepSeek response missing required fields, falling back to local analysis`);
                        }
                    }
                    catch (parseError) {
                        console.log(`⚠️ Failed to parse DeepSeek JSON response, trying markdown extraction...`);
                        // If JSON parsing fails, try to extract content from markdown
                        const markdownMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
                        if (markdownMatch) {
                            try {
                                const jsonContent = markdownMatch[1];
                                const parsedResponse = JSON.parse(jsonContent);
                                if (parsedResponse.insights && parsedResponse.recommendations &&
                                    parsedResponse.trends && parsedResponse.summary) {
                                    console.log(`🎯 DeepSeek analysis successful (from markdown), returning AI insights`);
                                    return res.json(Object.assign(Object.assign({}, parsedResponse), { source: 'deepseek' }));
                                }
                            }
                            catch (markdownParseError) {
                                console.log(`⚠️ Markdown extraction failed, falling back to local analysis`);
                            }
                        }
                    }
                }
                else {
                    console.log(`⚠️ No content in DeepSeek response, falling back to local analysis`);
                }
                // If we get here, parsing failed, break retry loop
                break;
            }
            catch (apiError) {
                lastError = apiError;
                // Better error handling for different types of errors
                if (apiError.code === 'ECONNRESET' || apiError.code === 'ECONNABORTED') {
                    console.error(`❌ DeepSeek API connection error (attempt ${attempt}/2):`, apiError.code);
                }
                else if (apiError.response) {
                    console.error(`❌ DeepSeek API response error (attempt ${attempt}/2):`, apiError.response.status, apiError.response.data);
                }
                else if (apiError.request) {
                    console.error(`❌ DeepSeek API request error (attempt ${attempt}/2):`, apiError.message);
                }
                else {
                    console.error(`❌ DeepSeek API error (attempt ${attempt}/2):`, apiError.message);
                }
                // If this is the last attempt, don't wait
                if (attempt < 2) {
                    console.log(`⏳ Waiting 1 second before retry...`);
                    yield new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                }
            }
        }
        // If all attempts failed, fallback to local analysis
        console.log(`🔄 All DeepSeek attempts failed, using local analysis fallback`);
        const localAnalysis = generateLocalAnalysis(dashboardData);
        return res.json(localAnalysis);
    }
    catch (error) {
        console.error('Dashboard analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze dashboard',
            source: 'local'
        });
    }
}));
// AI-powered monthly reports analysis endpoint
router.post('/analyze-reports', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const reportsData = req.body;
        // Check if DeepSeek API is available
        if (!DEEPSEEK_API_KEY) {
            const localAnalysis = generateLocalReportsAnalysis(reportsData);
            return res.json(localAnalysis);
        }
        // Prepare concise prompt for DeepSeek
        const prompt = `Analizza questi dati dei rapporti mensili e fornisci:

1. **Approfondimenti** (3-4 punti): Analisi dei pattern e performance
2. **Raccomandazioni** (2-3 punti): Suggerimenti per migliorare l'efficienza
3. **Tendenze** (2-3 punti): Pattern identificati e direzioni
4. **Riepilogo**: Sintesi in 1-2 frasi

Dati dei Rapporti:
- Totale Rapporti: ${reportsData.totalReports}
- Rapporti Completati: ${reportsData.completedReports}
- Ore Totali: ${reportsData.totalHours}
- Ore Medie per Rapporto: ${reportsData.averageHoursPerReport.toFixed(2)}
- Tecnici Coinvolti: ${reportsData.technicianCount}
- Clienti Coinvolti: ${reportsData.clientCount}
- Cantieri Coinvolti: ${reportsData.worksiteCount}

Rispondi in italiano, in formato JSON:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2"],
  "trends": ["trend1", "trend2"],
  "summary": "riepilogo"
}`;
        // Simple retry mechanism
        let lastError;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`🔄 Attempting DeepSeek API call for reports analysis (attempt ${attempt}/2)...`);
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'Sei un analista esperto di project management e gestione rapporti tecnici. Analizza i dati forniti e fornisci insights professionali e raccomandazioni concrete in italiano.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                };
                const response = yield axios_1.default.post(DEEPSEEK_API_URL, requestData, {
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000,
                });
                const aiResponse = (_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (aiResponse) {
                    try {
                        const parsedResponse = JSON.parse(aiResponse);
                        if (parsedResponse.insights && parsedResponse.recommendations &&
                            parsedResponse.trends && parsedResponse.summary) {
                            return res.json(Object.assign(Object.assign({}, parsedResponse), { source: 'deepseek' }));
                        }
                    }
                    catch (parseError) {
                        const markdownMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
                        if (markdownMatch) {
                            try {
                                const jsonContent = markdownMatch[1];
                                const parsedResponse = JSON.parse(jsonContent);
                                if (parsedResponse.insights && parsedResponse.recommendations &&
                                    parsedResponse.trends && parsedResponse.summary) {
                                    return res.json(Object.assign(Object.assign({}, parsedResponse), { source: 'deepseek' }));
                                }
                            }
                            catch (markdownParseError) {
                                // Fall through to local analysis
                            }
                        }
                    }
                }
                break;
            }
            catch (apiError) {
                lastError = apiError;
                if (apiError.code === 'ECONNRESET' || apiError.code === 'ECONNABORTED') {
                    console.error(`❌ DeepSeek API connection error (attempt ${attempt}/2):`, apiError.code);
                }
                else if (apiError.response) {
                    console.error(`❌ DeepSeek API response error (attempt ${attempt}/2):`, apiError.response.status, apiError.response.data);
                }
                else if (apiError.request) {
                    console.error(`❌ DeepSeek API request error (attempt ${attempt}/2):`, apiError.message);
                }
                else {
                    console.error(`❌ DeepSeek API error (attempt ${attempt}/2):`, apiError.message);
                }
                if (attempt < 2) {
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        // Fallback to local analysis
        const localAnalysis = generateLocalReportsAnalysis(reportsData);
        return res.json(localAnalysis);
    }
    catch (error) {
        console.error('Reports analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze reports',
            source: 'local'
        });
    }
}));
// Local analysis fallback for reports
const generateLocalReportsAnalysis = (data) => {
    const completionRate = data.totalReports > 0 ? data.completedReports / data.totalReports : 0;
    const efficiencyScore = data.averageHoursPerReport > 0 ? 8 / data.averageHoursPerReport : 0;
    const insights = [];
    const recommendations = [];
    const trends = [];
    // Generate insights
    if (completionRate > 0.8) {
        insights.push('Eccellente tasso di completamento rapporti! Il team mostra forte efficienza e capacità di delivery');
    }
    else if (completionRate > 0.6) {
        insights.push('Buon progresso sui rapporti, ma c\'è spazio per migliorare il follow-through e la chiusura progetti');
    }
    else {
        insights.push('Tasso di completamento moderato suggerisce potenziali colli di bottiglia nei flussi di lavoro');
    }
    if (data.technicianCount > 5) {
        insights.push('Team tecnico ben distribuito con buona copertura su diversi progetti e cantieri');
    }
    else {
        insights.push('Team tecnico compatto, ottimale per progetti focalizzati e comunicazione diretta');
    }
    if (data.averageHoursPerReport > 8) {
        insights.push('Rapporti richiedono tempo significativo, indicando progetti complessi e dettagliati');
    }
    else {
        insights.push('Rapporti efficienti con buon equilibrio tra dettaglio e velocità di completamento');
    }
    // Generate recommendations
    if (completionRate < 0.8) {
        recommendations.push('Implementare sistemi di tracking più robusti per migliorare i tassi di completamento');
    }
    if (data.averageHoursPerReport > 10) {
        recommendations.push('Valutare la possibilità di suddividere rapporti complessi in milestone più gestibili');
    }
    if (data.technicianCount < 3) {
        recommendations.push('Considerare l\'espansione del team tecnico per gestire meglio il carico di lavoro');
    }
    // Generate trends
    trends.push('Performance mensile dei rapporti tecnici');
    trends.push('Efficienza del team e gestione del tempo');
    trends.push('Distribuzione del lavoro tra tecnici e cantieri');
    return {
        insights: insights.length > 0 ? insights : ['Analisi dei rapporti mensili completata con successo'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continuare a monitorare le performance e ottimizzare i processi'],
        trends: trends.length > 0 ? trends : ['Pattern di lavoro consistenti con opportunità di miglioramento'],
        summary: 'Analisi dei rapporti mensili mostra performance solide con identificati spazi di ottimizzazione per efficienza e completamento progetti.',
        source: 'local'
    };
};
// AI-powered product analysis endpoint
router.post('/analyze-products', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { products, totalCount, analysisContext } = req.body;
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({
                error: 'Invalid products data'
            });
        }
        // Check if DeepSeek API is available
        if (!DEEPSEEK_API_KEY) {
            const localAnalysis = generateLocalProductAnalysis(products, totalCount);
            return res.json(localAnalysis);
        }
        // Prepare concise prompt for DeepSeek
        const prompt = `Analizza questo catalogo prodotti aziendale e fornisci:

1. **Insights Chiave** (3-4 punti): Analisi dei prodotti più significativi e pattern identificati
2. **Raccomandazioni** (2-3 punti): Suggerimenti per ottimizzare il catalogo e le strategie
3. **Opportunità di Business** (2-3 punti): Identificazione di trend e potenziali sviluppi
4. **Riepilogo Esecutivo**: Sintesi in 1-2 frasi

Dati del Catalogo:
- Totale Prodotti: ${totalCount}
- Campioni Analizzati: ${products.length}
- Contesto: ${analysisContext}

Prodotti di Esempio:
${products.slice(0, 10).map((p, i) => `${i + 1}. ${p.descrizione || 'N/A'} - ${p.fornitore || 'N/A'} - €${p.prezzo_acquisto || 'N/A'} - ${p.utile || 'N/A'}%`).join('\n')}

Rispondi in italiano, in formato JSON:
{
  "summary": "riepilogo esecutivo",
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"],
  "trends": ["trend1", "trend2"],
  "missingFields": 0,
  "inconsistentData": 0,
  "oddValues": 0
}`;
        // Simple retry mechanism
        let lastError;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                console.log(`🔄 Attempting DeepSeek API call for products (attempt ${attempt}/2)...`);
                const requestData = {
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: 'Sei un analista aziendale esperto specializzato in analisi di cataloghi prodotti. Analizza i dati forniti e fornisci insights professionali e raccomandazioni concrete in italiano.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                };
                const response = yield axios_1.default.post(DEEPSEEK_API_URL, requestData, {
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000,
                });
                console.log(`✅ DeepSeek API response received for products (status: ${response.status})`);
                const aiResponse = (_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (aiResponse) {
                    try {
                        const parsedResponse = JSON.parse(aiResponse);
                        if (parsedResponse.summary && parsedResponse.insights &&
                            parsedResponse.recommendations && parsedResponse.trends) {
                            console.log(`🎯 DeepSeek product analysis successful`);
                            return res.json(Object.assign(Object.assign({}, parsedResponse), { source: 'deepseek' }));
                        }
                        else {
                            console.log(`⚠️ DeepSeek response missing required fields, falling back to local analysis`);
                        }
                    }
                    catch (parseError) {
                        console.log(`⚠️ Failed to parse DeepSeek JSON response, trying markdown extraction...`);
                        const markdownMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
                        if (markdownMatch) {
                            try {
                                const jsonContent = markdownMatch[1];
                                const parsedResponse = JSON.parse(jsonContent);
                                if (parsedResponse.summary && parsedResponse.insights &&
                                    parsedResponse.recommendations && parsedResponse.trends) {
                                    console.log(`🎯 DeepSeek product analysis successful (from markdown)`);
                                    return res.json(Object.assign(Object.assign({}, parsedResponse), { source: 'deepseek' }));
                                }
                            }
                            catch (e) {
                                console.log(`⚠️ Failed to parse markdown JSON content`);
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.log(`❌ DeepSeek API attempt ${attempt} failed:`, error.message);
                lastError = error;
                if (attempt < 2) {
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        // If all DeepSeek attempts failed, fall back to local analysis
        console.log(`🔄 All DeepSeek attempts failed, falling back to local product analysis`);
        const localAnalysis = generateLocalProductAnalysis(products, totalCount);
        return res.json(localAnalysis);
    }
    catch (error) {
        console.error('Product analysis error:', error.message);
        res.status(500).json({
            error: 'Internal server error during product analysis',
            details: error.message
        });
    }
}));
// Local product analysis fallback
const generateLocalProductAnalysis = (products, totalCount) => {
    // Basic data quality analysis
    let missingFields = 0;
    let inconsistentData = 0;
    let oddValues = 0;
    products.forEach(product => {
        const requiredFields = ['descrizione', 'fornitore', 'prezzo_acquisto'];
        missingFields += requiredFields.filter(field => !product[field] || product[field] === '' || product[field] === null).length;
        if (product.prezzo_acquisto && (product.prezzo_acquisto < 0 || product.prezzo_acquisto > 1000000)) {
            oddValues++;
        }
        if (product.utile && (product.utile < 0 || product.utile > 1000)) {
            oddValues++;
        }
        if (typeof product.prezzo_acquisto !== 'number' && product.prezzo_acquisto !== null) {
            inconsistentData++;
        }
    });
    return {
        summary: `Analisi locale del catalogo prodotti: ${totalCount} prodotti totali, ${missingFields} campi mancanti, ${oddValues} valori anomali`,
        insights: [
            `Catalogo con ${totalCount} prodotti analizzati`,
            `${missingFields} campi obbligatori da completare`,
            `${oddValues} valori che richiedono verifica`
        ],
        recommendations: [
            'Completare i campi obbligatori mancanti',
            'Verificare i valori anomali identificati',
            'Standardizzare i formati dei dati'
        ],
        trends: [
            'Focus sulla qualità dei dati',
            'Standardizzazione del catalogo',
            'Controllo qualità continuo'
        ],
        missingFields,
        inconsistentData,
        oddValues,
        source: 'local'
    };
};
exports.default = router;
