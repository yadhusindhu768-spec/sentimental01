const inputText = document.querySelector('#inputText');
const charCount = document.querySelector('#charCount');
const analyzeButton = document.querySelector('#analyzeButton');
const clearButton = document.querySelector('#clearButton');
const clearHistory = document.querySelector('#clearHistory');
const result = document.querySelector('#result');
const historyList = document.querySelector('#historyList');
const toast = document.querySelector('#toast');
const positiveWords = new Set('good great happy love amazing best awesome nice fantastic friendly positive excellent safe supportive helpful kind valued beautiful success strong thanks appreciate thoughtful wonderful excited proud'.split(' '));
const negativeWords = new Set('bad sad hate terrible worst awful angry mean problem scary negative horrible stress hurt unsafe rude failure weak upset annoying frustrated unacceptable disappointed delay issue'.split(' '));
const riskWords = new Set('stupid idiot hate dumb ridiculous blame worst unacceptable'.split(' '));
let latestAnalysis = null;

function analyzeSentiment(text) { const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean); const positive = words.filter(word => positiveWords.has(word)).length; const negative = words.filter(word => negativeWords.has(word)).length; const intensity = Math.min(1, (positive + negative) / Math.max(words.length * .22, 1)); const rawScore = positive - negative; const score = Math.max(-1, Math.min(1, rawScore / Math.max(positive + negative, 2))); const sentiment = score > .16 ? 'Positive' : score < -.16 ? 'Negative' : 'Neutral'; const risky = [...riskWords].some(word => words.includes(word)); const safety = risky ? 'Review first' : negative > positive && intensity > .55 ? 'Consider a softer edit' : 'Ready to share'; const toneCopy = sentiment === 'Positive' ? 'Warm and encouraging' : sentiment === 'Negative' ? 'Direct and emotionally charged' : 'Measured and balanced'; const suggestion = risky ? 'Try naming the issue without labeling a person. Specific, calm language will make your point easier to hear.' : sentiment === 'Negative' ? 'Lead with the outcome you want. A concrete next step can turn frustration into a constructive conversation.' : sentiment === 'Positive' ? 'The warmth comes through clearly. Consider adding one specific detail if you want the message to feel even more personal.' : 'The tone is steady and easy to follow. Add a little context or a clear ask if you want a stronger response.'; return { sentiment, score, positive, negative, intensity, safety, toneCopy, suggestion, text, risky } }

function showToast(message) { toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200) }

function updateCounter() { charCount.textContent = `${inputText.value.length} / 500` }

function saveHistory(analysis) { const history = JSON.parse(localStorage.getItem('sentimentiq-history') || '[]');
    history.unshift({ text: analysis.text, sentiment: analysis.sentiment });
    localStorage.setItem('sentimentiq-history', JSON.stringify(history.slice(0, 5)));
    renderHistory() }

function renderHistory() { const history = JSON.parse(localStorage.getItem('sentimentiq-history') || '[]'); if (!history.length) { historyList.innerHTML = '<p class="empty-history">Your latest analyses will appear here.</p>'; return }
    historyList.innerHTML = history.map((item, index) => `<div class="history-item" data-index="${index}"><span class="history-dot ${item.sentiment.toLowerCase()}"></span><span class="history-text">${escapeHtml(item.text)}</span><span class="history-tone">${item.sentiment}</span></div>`).join('');
    historyList.querySelectorAll('.history-item').forEach(item => item.addEventListener('click', () => { inputText.value = history[Number(item.dataset.index)].text;
        updateCounter();
        inputText.focus() })) }

function escapeHtml(value) { const element = document.createElement('div');
    element.textContent = value; return element.innerHTML }

function renderResult(analysis) { latestAnalysis = analysis; const score = Math.round(analysis.score * 100);
    document.querySelector('#sentimentLabel').textContent = analysis.sentiment;
    document.querySelector('#sentimentIcon').textContent = analysis.sentiment === 'Positive' ? '☺' : analysis.sentiment === 'Negative' ? '!' : '•';
    document.querySelector('#scoreValue').textContent = `${score>=0?'+':''}${score}%`;
    document.querySelector('#scoreMeter').style.width = `${Math.max(10,(score+100)/2)}%`;
    document.querySelector('#scoreCaption').textContent = analysis.toneCopy;
    document.querySelector('#safetyBadge').textContent = analysis.safety;
    document.querySelector('#safetyCaption').textContent = analysis.risky ? 'A small edit is recommended' : 'Clear and considerate';
    document.querySelector('#scoreLabel').textContent = `${analysis.toneCopy}. We found ${analysis.positive} positive and ${analysis.negative} negative signal${analysis.positive+analysis.negative===1?'':'s'} in this draft.`;
    document.querySelector('#explanationText').textContent = analysis.suggestion;
    result.classList.remove('hidden');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }
async function handleAnalyze() { const text = inputText.value.trim(); if (!text) { showToast('Write a message before analyzing.');
        inputText.focus(); return }
    analyzeButton.disabled = true;
    document.querySelector('.button-label').textContent = 'Reading your message...';
    document.querySelector('#spinner').classList.remove('hidden');
    await new Promise(resolve => window.setTimeout(resolve, 450)); const analysis = analyzeSentiment(text);
    renderResult(analysis);
    saveHistory(analysis);
    analyzeButton.disabled = false;
    document.querySelector('.button-label').textContent = 'Analyze again';
    document.querySelector('#spinner').classList.add('hidden') }
inputText.addEventListener('input', updateCounter);
inputText.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault();
        handleAnalyze() } });
analyzeButton.addEventListener('click', handleAnalyze);
clearButton.addEventListener('click', () => { inputText.value = '';
    updateCounter();
    inputText.focus();
    result.classList.add('hidden');
    document.querySelector('.button-label').textContent = 'Analyze my message' });
clearHistory.addEventListener('click', () => { localStorage.removeItem('sentimentiq-history');
    renderHistory();
    showToast('History cleared.') });
document.querySelectorAll('.sample-chip').forEach(chip => chip.addEventListener('click', () => { inputText.value = chip.dataset.sample;
    updateCounter();
    inputText.focus() }));
document.querySelector('#copyButton').addEventListener('click', async() => { if (!latestAnalysis) return; const text = `SentimentIQ: ${latestAnalysis.sentiment} tone (${Math.round(latestAnalysis.score*100)}%). ${latestAnalysis.suggestion}`;
    await navigator.clipboard.writeText(text);
    showToast('Insight copied to clipboard.') });
renderHistory();