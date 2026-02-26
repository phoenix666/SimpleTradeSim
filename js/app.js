let cashBalance = 10000;
let leverage = 10;
let positionSize = 50000;
let currentPosition = 0;
let positionCostBasis = 0;   // сколько всего "вложено" в позицию по цене открытия (сумма всех размеров при Buy)
let positionMargin = 0;      // сколько реально зарезервировано кэша из CashBalance под эту позицию
let unrealizedGain = 0; // нереализованная прибиль или убыток
const MAX_LOG_ENTRIES = 10;

function logOperation(action, amount, pnl = 0) {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    const pnlStr = pnl === 0 ? '—' : (pnl > 0 ? `+${Math.round(pnl)}` : Math.round(pnl));
    entry.innerHTML = `${action}: <span>${Math.round(amount)}</span> | <span class="${pnl > 0 ? 'pos-light' : (pnl < 0 ? 'neg-light' : '')}">${pnlStr}</span>`;
    logDiv.insertBefore(entry, logDiv.firstChild);
    while (logDiv.children.length > MAX_LOG_ENTRIES) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

function updateTradingDisplay() {
    document.getElementById('cashBalanceDisplay').textContent = Math.round(cashBalance);
    
    const posDisplay = document.getElementById('currentPositionDisplay');
    posDisplay.textContent = Math.round(currentPosition);
    if (currentPosition > 0) {
        posDisplay.className = 'pos-light';
    } else if (currentPosition < 0) {
        posDisplay.className = 'neg-light';
    } else {
        posDisplay.className = '';
    }
    
    const gainDisplay = document.getElementById('unrealizedGainDisplay');
    if (currentPosition != 0 && lastIndex > 0) {
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

function increasePosition(marginSize,positionSize)
{
    if (marginSize > cashBalance) return;
    cashBalance -= marginSize;
    currentPosition += positionSize;
    positionMargin += marginSize;
    positionCostBasis += positionSize;
    logOperation(positionSize > 0 ? 'Long' : 'Short', positionSize, 0);
}

function closePosition(partSize = 0) {
    if (currentPosition === 0 || positionMargin <= 0) {
        return;
    }

    const isLong  = currentPosition > 0;
    const absPos  = Math.abs(currentPosition);
    let closedPnl = 0;

    if (partSize == 0 || partSize >= absPos) {
        // Полное закрытие
        closedPnl = unrealizedGain;
        cashBalance += positionMargin + unrealizedGain;
        currentPosition   = 0;
        positionCostBasis = 0;
        positionMargin    = 0;
        unrealizedGain    = 0;
        logOperation('Close', currentPosition > 0 ? absPos : -absPos, closedPnl);
        return;
    }

    // Частичное закрытие
    const fraction = partSize / absPos;          // теперь всегда 0 < fraction ≤ 1

    const pnlShare    = fraction * unrealizedGain;
    const marginShare = fraction * positionMargin;

    closedPnl = pnlShare;
    cashBalance += marginShare + pnlShare;

    // Пропорциональное уменьшение (сохраняет знак!)
    currentPosition   *= (1 - fraction);
    positionCostBasis *= (1 - fraction);
    positionMargin    *= (1 - fraction);

    unrealizedGain = currentPosition - positionCostBasis;
    logOperation('Partial close', currentPosition > 0 ? partSize : -partSize, closedPnl);
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
        positionCostBasis = 0;
        positionMargin = 0;
        document.getElementById('positionSizeInput').value = positionSize;
        render();
        updateTradingDisplay();
    }
});

document.getElementById('stepForwardBtn').addEventListener('click', function() {
    if (candles.length > 0 && lastIndex < candles.length) {
        const oldClose = candles[lastIndex-1].close;
        lastIndex++;
        const newClose = candles[lastIndex-1].close; 
        
        if (currentPosition != 0) {
            currentPosition = currentPosition * newClose / oldClose;
            unrealizedGain = currentPosition - positionCostBasis;
        }
        
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
    if(currentPosition < 0)
    {
        closePosition();
        updateTradingDisplay();
    }
    else{
        const cost = positionSize / leverage;
        if (cost <= cashBalance) {
            increasePosition(cost,positionSize);
            updateTradingDisplay();
        }
    }
});

document.getElementById('sellBtn').addEventListener('click', function() {
    if (candles.length === 0 || lastIndex === 0) return;
    if (currentPosition > 0) {
        closePosition();
        updateTradingDisplay();
    }
    else{
        const cost = positionSize / leverage;
        if (cost <= cashBalance) {
            increasePosition(cost,-positionSize);
            updateTradingDisplay();
        }
    }
});
