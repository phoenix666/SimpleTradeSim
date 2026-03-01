let cashBalance = 10000;
let leverage = 20;
let positionSize = 50000;
let currentPosition = 0;
let positionCostBasis = 0;
let positionMargin = 0;
let unrealizedGain = 0;
let spreadValue = 0;
let slClose = 0;
let entryPrice = 0;
const MAX_LOG_ENTRIES = 20;

function applyDefaultSettings() {
    if (typeof getDefaultSettings === 'function') {
        const defaults = getDefaultSettings();
        cashBalance = defaults.cashBalance;
        positionSize = defaults.positionSize;
        document.getElementById('cashBalanceDisplay').textContent = Math.round(cashBalance);
        document.getElementById('positionSizeInput').value = positionSize;
    }
}

let lastLogCount = 0;
let lastLogEntry = null;

function calculateSpread() {
    const emulateSpread = document.getElementById('emulateSpread').checked;
    if (!emulateSpread || candles.length === 0) {
        spreadValue = 0;
        return;
    }
    
    const startIdx = Math.max(0, lastIndex - 20);
    let sum = 0;
    let count = 0;
    
    for (let i = startIdx; i < lastIndex; i++) {
        sum += candles[i].high - candles[i].low;
        count++;
    }
    
    spreadValue = ((sum / count) * 0.05)/candles[lastIndex-1].close; // percentage, not absolute value
}

function logOperation(action, amount, pnl = 0) {
    const logDiv = document.getElementById('log');
    
    if(slClose==0) slClose = candles[lastIndex-1].close;
    const pnlStr = pnl === 0 ? '—' : (pnl > 0 ? `+${Math.round(pnl)}` : Math.round(pnl));
    const str = `<span class="col-action">${action}:</span><span class="col-amount">${Math.round(amount)}</span><span class="col-price">${slClose.toFixed(maxDecimalDigits)}</span><span class="col-pnl ${pnl > 0 ? 'pos-light' : (pnl < 0 ? 'neg-light' : '')}">${pnlStr}</span><span class="col-count"></span>`;
    slClose = 0;
    if(lastLogEntry!==null && str == lastLogEntry)
    {
        lastLogCount++;
        logDiv.firstChild.querySelector('.col-count').textContent = ` *${lastLogCount}`;
    }
    else{
        lastLogEntry = str;
        const entry = document.createElement('div');
        entry.innerHTML = str;
        logDiv.insertBefore(entry, logDiv.firstChild);
        lastLogCount = 1;
    }
    
    while (logDiv.children.length > MAX_LOG_ENTRIES) {
        logDiv.removeChild(logDiv.lastChild);
    }
}

function getMaxHlRange() {
    if (!candles || lastIndex === 0) return 0;
    const start = Math.max(0, lastIndex - CANDLE_COUNT);
    let maxHl = 0;
    for (let i = start; i < lastIndex; i++) {
        const hl = candles[i].high - candles[i].low;
        if (hl > maxHl) maxHl = hl;
    }
    return maxHl;
}

function initStopLimit(isLong) {
    if (!document.getElementById('useSl').checked) return;
    const openPrice = candles[lastIndex - 1].close;
    const maxHl = getMaxHlRange();
    if (isLong) {
        stopLoss = openPrice - maxHl;
        profitLimit = openPrice + maxHl;
    } else {
        stopLoss = openPrice + maxHl;
        profitLimit = openPrice - maxHl;
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

    const buyBtn = document.getElementById('buyBtn');
    const sellBtn = document.getElementById('sellBtn');
    if (currentPosition > 0) {
        buyBtn.textContent = 'Buy';
        sellBtn.textContent = 'Close';
    } else if (currentPosition < 0) {
        buyBtn.textContent = 'Close';
        sellBtn.textContent = 'Sell';
    } else {
        buyBtn.textContent = 'Buy';
        sellBtn.textContent = 'Sell';
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
    if(entryPrice==0) entryPrice = candles[lastIndex-1].close;
    const wasZero = currentPosition === 0;
    cashBalance -= marginSize;
    currentPosition += positionSize;
    positionMargin += marginSize;
    positionCostBasis += positionSize * (positionSize<0?(1-spreadValue):(1+spreadValue));
    unrealizedGain = currentPosition - positionCostBasis;
    if (wasZero) {
        initStopLimit(positionSize > 0);
        if (stopLoss > 0 || profitLimit > 0) {
            setStopLimit(stopLoss, profitLimit);
        }
    }
    logOperation(positionSize > 0 ? 'Long' : 'Short', positionSize, 0);
    render();
}

function checkStopLimitClose(newCandle, oldClose) {
    if (currentPosition === 0) {
        return false;
    }
    
    const { open, high, low, close } = newCandle;
    const whatHappenedFirst = close < open ? high : low;
    const whatHappenedSecond = close < open ? low : high;
    
    const inRange = (value, a, b) => {
        const min = Math.min(a, b);
        const max = Math.max(a, b);
        return value >= min && value <= max;
    };
    // spread correction
    let spreadCorrection = (currentPosition<0?(1-spreadValue):(1+spreadValue)); //seems right after testing
        
    if (stopLoss > 0 && inRange(stopLoss, oldClose, whatHappenedFirst)) {
        unrealizedGain = currentPosition * (stopLoss / oldClose) - positionCostBasis*spreadCorrection;
        slClose = stopLoss;
        //shadowGain = currentPosition * (stopLoss / oldClose) - positionCostBasis;
        //console.log(" "+unrealizedGain+" ; "+shadowGain); this was testing in all 4
        closePosition();
        updateTradingDisplay();
        return true;
    }
    
    if (profitLimit > 0 && inRange(profitLimit, oldClose, whatHappenedFirst)) {
        unrealizedGain = currentPosition * (profitLimit / oldClose) - positionCostBasis*spreadCorrection;
        slClose = profitLimit;
        closePosition();
        updateTradingDisplay();
        return true;
    }
    
    if (stopLoss > 0 && inRange(stopLoss, oldClose, whatHappenedSecond)) {
        unrealizedGain = currentPosition * (stopLoss / oldClose) - positionCostBasis*spreadCorrection;
        slClose = stopLoss;
        closePosition();
        updateTradingDisplay();
        return true;
    }
    
    if (profitLimit > 0 && inRange(profitLimit, oldClose, whatHappenedSecond)) {
        unrealizedGain = currentPosition * (profitLimit / oldClose) - positionCostBasis*spreadCorrection;
        slClose = profitLimit;
        closePosition();
        updateTradingDisplay();
        return true;
    }
    
    return false;
}

function checkMarginCall(newCandle, previousClose) {
    if (currentPosition === 0) {
        return false;
    }

    const { high, low } = newCandle;
    
    const checkPrice = (price) => {
        const tGain = currentPosition*(price/previousClose) - positionCostBasis;
        if (cashBalance + tGain < 0) {
            unrealizedGain = tGain;
            closePosition();
            updateTradingDisplay();
            showToast("The position was liquidated due to a margin call.");
            return true;
        }
        return false;
    };

    if (checkPrice(high)) return true;
    if (checkPrice(low)) return true;
    
    return false;
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
        entryPrice = 0;
        closedPnl = unrealizedGain;
        cashBalance += positionMargin + unrealizedGain;
        currentPosition   = 0;
        positionCostBasis = 0;
        positionMargin    = 0;
        unrealizedGain    = 0;
        stopLoss = 0;
        profitLimit = 0;
        clearStopLimit();
        logOperation('Close', currentPosition > 0 ? absPos : -absPos, closedPnl);
        render();
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
    loadSettings();
    updateTradingDisplay();
}

function loadSettings() {
    const useSl = localStorage.getItem('tradeSimUseSl');
    const emulateSpread = localStorage.getItem('tradeSimEmulateSpread');
    const leverageVal = localStorage.getItem('tradeSimLeverage');
    if (useSl !== null) {
        document.getElementById('useSl').checked = useSl === 'true';
    }
    if (emulateSpread !== null) {
        document.getElementById('emulateSpread').checked = emulateSpread === 'true';
    }
    if (leverageVal !== null) {
        document.getElementById('leverageSelect').value = leverageVal;
        leverage = parseInt(leverageVal);
    }
    calculateSpread();
}

function saveSettings() {
    localStorage.setItem('tradeSimUseSl', document.getElementById('useSl').checked);
    localStorage.setItem('tradeSimEmulateSpread', document.getElementById('emulateSpread').checked);
    localStorage.setItem('tradeSimLeverage', document.getElementById('leverageSelect').value);
}

window.addEventListener('beforeunload', saveSettings);

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
        const defaults = typeof getDefaultSettings === 'function' ? getDefaultSettings() : { cashBalance: 10000, positionSize: 50000 };
        cashBalance = defaults.cashBalance;
        positionSize = defaults.positionSize;
        currentPosition = 0;
        positionCostBasis = 0;
        positionMargin = 0;
        clearStopLimit();
        document.getElementById('cashBalanceDisplay').textContent = Math.round(cashBalance);
        document.getElementById('positionSizeInput').value = positionSize;
        calculateSpread();
        render();
        updateTradingDisplay();
    }
});

document.getElementById('stepForwardBtn').addEventListener('click', function() {
    if (candles.length > 0 && lastIndex < candles.length) {
        const oldClose = candles[lastIndex-1].close;
        const previousClose = lastIndex >= 2 ? candles[lastIndex-2].close : oldClose;
        lastIndex++;
        const newCandle = candles[lastIndex-1];
        const newClose = newCandle.close; 
        
        if (currentPosition !== 0 && (stopLoss > 0 || profitLimit > 0)) {
            if (checkStopLimitClose(newCandle, oldClose)) {
                return;
            }
        }
        
        if (currentPosition !== 0) {
            if (checkMarginCall(newCandle, previousClose)) {
                calculateSpread();
                render();
                updateTradingDisplay();
                return;
            }
            currentPosition = currentPosition * newClose/ oldClose;
            unrealizedGain = currentPosition - positionCostBasis*(currentPosition<0?(1-spreadValue):(1+spreadValue));
        }
        
        calculateSpread();
        render();
        updateTradingDisplay();
    } else {
        showToast('End of data reached. Hit "Random" to reset position');
    }
});

document.getElementById('leverageSelect').addEventListener('change', function() {
    leverage = parseInt(this.value);
    validatePositionSize();
});

document.getElementById('emulateSpread').addEventListener('change', function() {
    calculateSpread();
    saveSettings();
});

document.getElementById('positionSizeInput').addEventListener('input', function() {
    positionSize = parseInt(this.value) || 0;
    validatePositionSize();
});

document.getElementById('positionSizeInput').addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        adjustPositionSize(e.key === 'ArrowUp' ? 1 : -1);
    }
});

function adjustPositionSize(direction) {
    const input = document.getElementById('positionSizeInput');
    let val = parseInt(input.value) || 1;
    
    if (direction > 0) {
        val = val * 2;
    } else {
        val = Math.floor(val / 2);
        if (val < 1) val = 1;
    }
    
    input.value = val;
    positionSize = val;
    validatePositionSize();
}

document.getElementById('posSizeUp').addEventListener('click', function() {
    adjustPositionSize(1);
});

document.getElementById('posSizeDown').addEventListener('click', function() {
    adjustPositionSize(-1);
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

document.getElementById('closeHalfBtn').addEventListener('click', function() {
    if (currentPosition === 0) return;
    const halfSize = Math.abs(currentPosition) / 2;
    closePosition(halfSize);
    updateTradingDisplay();
});

document.getElementById('useSl').addEventListener('change', function() {
	if (!this.checked) {
		stopLoss = 0;
		profitLimit = 0;
		clearStopLimit();
	}
	render();
	saveSettings();
});

document.getElementById('hotkeySettingsBtn').addEventListener('click', toggleSettingsModal);

document.getElementById('defaultSettingsLink').addEventListener('click', function(e) {
    e.preventDefault();
    toggleDefaultsModal();
});

if (typeof applyDefaultSettings === 'function') {
    applyDefaultSettings();
}

console.log("app.js loaded");
