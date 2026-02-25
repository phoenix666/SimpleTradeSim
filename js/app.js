let cashBalance = 10000;
let leverage = 10;
let positionSize = 50000;
let currentPosition = 0;
let positionCostBasis = 0;   // сколько всего "вложено" в позицию по цене открытия (сумма всех размеров при Buy)
let positionMargin = 0;      // сколько реально зарезервировано кэша из CashBalance под эту позицию
let unrealizedGain = 0; // нереализованная прибиль или убыток

function updateTradingDisplay() {
    document.getElementById('cashBalanceDisplay').textContent = Math.round(cashBalance);
    document.getElementById('currentPositionDisplay').textContent = Math.round(currentPosition);
    
    const gainDisplay = document.getElementById('unrealizedGainDisplay');
    if (currentPosition > 0 && lastIndex > 0) {
        const currentPrice = candles[lastIndex - 1].close;
        gainDisplay.textContent = Math.round(unrealizedGain);
        gainDisplay.className = unrealizedGain >= 0 ? 'positive' : 'negative';
    } else {
        gainDisplay.textContent = '0';
        gainDisplay.className = '';
    }
}

function validatePositionSize() {
    const maxAllowed = cashBalance * 0.8 * leverage;
    if (positionSize > maxAllowed) {
        positionSize = Math.floor(maxAllowed);
        document.getElementById('positionSizeInput').value = positionSize;
    }
}

async function updateButtonState() {
    const count = await getCandleCount();
    document.getElementById('clearBtn').disabled = count === 0;
    return count;
}

async function init() {
    await openDB();
    console.log('IndexedDB инициализирована');
    await updateButtonState();
    await loadAndRender();
    if (candles.length > 0 && lastIndex > 0) {
        previousClosePrice = candles[lastIndex - 1].close;
    }
    updateTradingDisplay();
}

init();

document.getElementById('fileInput').addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        loadCandles(e.target.files[0]);
    }
});

document.getElementById('clearBtn').addEventListener('click', async function() {
    await clearCandles();
    await updateButtonState();
    candles = [];
    lastIndex = 0;
    render();
    console.log('База очищена');
});

document.getElementById('randomBtn').addEventListener('click', function() {
    if (candles.length > 0) {
        const minIndex = Math.min(20, candles.length);
        lastIndex = Math.floor(Math.random() * (candles.length - minIndex + 1)) + minIndex;
        cashBalance = 10000;
        positionSize = 50000;
        currentPosition = 0;
        previousClosePrice = candles[lastIndex - 1].close;
        document.getElementById('positionSizeInput').value = positionSize;
        render();
        updateTradingDisplay();
    }
});

document.getElementById('stepForwardBtn').addEventListener('click', function() {
    if (candles.length > 0 && lastIndex < candles.length) {
        const oldClose = candles[lastIndex - 1].close;
        lastIndex++;
        const newClose = candles[lastIndex - 1].close;
        
        if (currentPosition > 0) {
            currentPosition = currentPosition * newClose / oldClose;
        }
        previousClosePrice = newClose;
        unrealizedGain = currentPosition - positionCostBasis;
        
        render();
        updateTradingDisplay();
    }
});

document.getElementById('leverageSelect').addEventListener('change', function() {
    leverage = parseInt(this.value);
    validatePositionSize();
});

document.getElementById('positionSizeInput').addEventListener('input', function() {
    positionSize = parseInt(this.value) || 0;
    validatePositionSize();
});

document.getElementById('buyBtn').addEventListener('click', function() {
    if (candles.length === 0 || lastIndex === 0) return;
    
    const cost = positionSize / leverage;
    if (cost <= cashBalance) {
        cashBalance -= cost;
        currentPosition += positionSize;
        positionMargin += cost;
        positionCostBasis += positionSize;
        previousClosePrice = candles[lastIndex - 1].close;
        updateTradingDisplay();
    }
});

document.getElementById('sellBtn').addEventListener('click', function() {
    if (currentPosition > 0) {
        cashBalance += positionMargin + unrealizedGain;
        positionCostBasis = 0;
        positionMargin = 0
        unrealizedGain = 0;
        currentPosition = 0;
        updateTradingDisplay();
    }
});
