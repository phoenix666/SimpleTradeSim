const DELIMITERS = [';', ',', ':', ' ', '\t'];

function detectDelimiter(lines) {
    const counts = {};
    for (const d of DELIMITERS) {
        counts[d] = 0;
        for (const line of lines.slice(0, 10)) {
            counts[d] += (line.match(new RegExp(d === ' ' ? '\\s' : d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseValue(str) {
    const cleaned = str.trim().replace(/,/g, '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

function isValidOHLC(cols) {
    const open = parseValue(cols[0]);
    const high = parseValue(cols[1]);
    const low = parseValue(cols[2]);
    const close = parseValue(cols[3]);
    
    if (open === null || high === null || low === null || close === null) return false;
    if (high < low) return false;
    if (open < low || open > high || close < low || close > high) return false;
    
    return true;
}

function findOHLCColumns(rows, delimiter) {
    const startRow = 0;
    const colsCount = rows[0].length;
    
    for (let col = 0; col < colsCount - 3; col++) {
        let validCount = 0;
        for (const row of rows.slice(startRow, startRow + 20)) {
            if (isValidOHLC(row.slice(col, col + 4))) validCount++;
        }
        if (validCount >= 5) return col;
    }
    return -1;
}

async function loadCandles(file) {
    const reader = new FileReader();
    let errorCount = 0;
    reader.onload = async function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length === 0) {
            console.log('File is empty');
            showToast('File is empty');
            return;
        }

        const delimiter = detectDelimiter(lines);
        const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
        
        const firstRow = rows[0];
        const numericCount = firstRow.filter(cell => parseValue(cell) !== null).length;
        const startRow = numericCount >= 4 ? 0 : 1;
        
        const ohlcStart = findOHLCColumns(rows.slice(startRow), delimiter);
        
        if (ohlcStart === -1) {
            console.log('Could not find 4 consecutive numeric columns');
            showToast('Could not find 4 consecutive numeric columns');
            return;
        }

        const candles = [];
        
        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            const cols = row.slice(ohlcStart, ohlcStart + 4);
            
            const open = parseValue(cols[0]);
            const high = parseValue(cols[1]);
            const low = parseValue(cols[2]);
            const close = parseValue(cols[3]);

            if (open === null || high === null || low === null || close === null) {
                console.log(`Row ${i + 1}: failed to parse numbers - ${row.join(delimiter)}`);
                errorCount++;
                continue;
            }

            if (high < low) {
                console.log(`Row ${i + 1}: high (${high}) is less than low (${low})`);
                errorCount++;
                continue;
            }

            if (open > high || open < low || close > high || close < low) {
                console.log(`Row ${i + 1}: open/close values out of range [low, high]`);
                errorCount++;
            }

            candles.push({ open, high, low, close });
        }

        const loading = document.getElementById('loading');
        const loadingText = document.getElementById('loading-text');
        loading.classList.add('show');
        
        await clearCandles();
        await addCandles(candles, (done, total) => {
            const pct = Math.round(done / total * 100);
            loadingText.textContent = `Loading... ${pct}%`;
        });
        
        loading.classList.remove('show');
        console.log(`Loaded ${candles.length} candles`);
        
        if (errorCount > 0) {
            console.log(`There were ${errorCount} errors during loading, see console log for details`);
            showToast('There were errors during loading, see console log for details');
        }
        
        if (typeof onCandlesLoaded === 'function') {
            onCandlesLoaded(candles.length);
        }
    };
    reader.readAsText(file);
}

console.log("parser.js loaded");

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}
