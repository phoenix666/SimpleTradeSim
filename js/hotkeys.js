const defaultHotkeys = {
    buy: 'a',
    sell: 's',
    close: 'z',
    stepForward: 'f',
    limitUp: 'l',
    limitDown: ',',
    stopUp: ';',
    stopDown: '.',
    settings: 'h'
};

const defaultSettings = {
    cashBalance: 10000,
    positionSize: 50000
};

let hotkeys = { ...defaultHotkeys };
let defaultParams = { ...defaultSettings };

function loadHotkeys() {
    const saved = localStorage.getItem('tradeSimHotkeys');
    if (saved) {
        try {
            hotkeys = JSON.parse(saved);
        } catch (e) {
            hotkeys = { ...defaultHotkeys };
        }
    }
}

function loadDefaultParams() {
    const saved = localStorage.getItem('tradeSimSettings');
    if (saved) {
        try {
            defaultParams = JSON.parse(saved);
        } catch (e) {
            defaultParams = { ...defaultSettings };
        }
    }
}

function saveHotkeys() {
    localStorage.setItem('tradeSimHotkeys', JSON.stringify(hotkeys));
}

function saveDefaultParams() {
    localStorage.setItem('tradeSimSettings', JSON.stringify(defaultParams));
}

function getDefaultSettings() {
    return { ...defaultParams };
}

function getStepSize() {
    if (!currentRange || candles.length === 0) return 0.01;
    const range = currentRange.max - currentRange.min;
    return range / 100;
}

function moveStop(direction) {
    if (stopLoss === 0) return;
    const step = getStepSize() * direction;
    stopLoss = parseFloat((stopLoss + step).toFixed(maxDecimalDigits));
    setStopLimit(stopLoss, profitLimit);
    if (typeof updateTradingDisplay === 'function') updateTradingDisplay();
}

function moveLimit(direction) {
    if (profitLimit === 0) return;
    const step = getStepSize() * direction;
    profitLimit = parseFloat((profitLimit + step).toFixed(maxDecimalDigits));
    setStopLimit(stopLoss, profitLimit);
    if (typeof updateTradingDisplay === 'function') updateTradingDisplay();
}

function closeFullPosition() {
    if (currentPosition === 0) return;
    closePosition();
    if (typeof updateTradingDisplay === 'function') updateTradingDisplay();
}

function handleHotkey(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    const key = e.key.toLowerCase();

    if (key === hotkeys.buy) {
        document.getElementById('buyBtn').click();
    } else if (key === hotkeys.sell) {
        document.getElementById('sellBtn').click();
    } else if (key === hotkeys.close) {
        closeFullPosition();
    } else if (key === hotkeys.stepForward) {
        document.getElementById('stepForwardBtn').click();
    } else if (key === hotkeys.limitUp) {
        moveLimit(1);
    } else if (key === hotkeys.limitDown) {
        moveLimit(-1);
    } else if (key === hotkeys.stopUp) {
        moveStop(1);
    } else if (key === hotkeys.stopDown) {
        moveStop(-1);
    } else if (key === hotkeys.settings) {
        toggleSettingsModal();
    }
}

function toggleSettingsModal() {
    let modal = document.getElementById('hotkeyModal');
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            renderHotkeyInputs();
            modal.style.display = 'flex';
        }
    } else {
        createSettingsModal();
        document.getElementById('hotkeyModal').style.display = 'flex';
    }
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = 'hotkeyModal';
    modal.innerHTML = `
        <div class="hotkey-overlay" onclick="if(event.target === this) toggleSettingsModal()">
            <div class="hotkey-content">
                <h3>Hotkey Settings</h3>
                <div class="hotkey-list" id="hotkeyList"></div>
                <div class="hotkey-buttons">
                    <button id="resetHotkeysBtn">Reset to Default</button>
                    <button id="closeHotkeyBtn">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
        .hotkey-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center;
            z-index: 3000;
        }
        .hotkey-content {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            min-width: 320px;
        }
        .hotkey-content h3 {
            margin: 0 0 15px 0;
            text-align: center;
        }
        .hotkey-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .hotkey-row label { font-size: 14px; }
        .hotkey-row input {
            width: 50px;
            padding: 5px;
            text-align: center;
            text-transform: lowercase;
            background: #1a1a1a;
            color: #ddd;
            border: 1px solid #444;
        }
        .hotkey-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        .hotkey-buttons button {
            padding: 8px 16px;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    document.getElementById('resetHotkeysBtn').addEventListener('click', function() {
        hotkeys = { ...defaultHotkeys };
        saveHotkeys();
        renderHotkeyInputs();
    });

    document.getElementById('closeHotkeyBtn').addEventListener('click', toggleSettingsModal);

    renderHotkeyInputs();
}

function toggleDefaultsModal() {
    let modal = document.getElementById('defaultsModal');
    if (modal) {
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
        } else {
            document.getElementById('defaultCashBalance').value = defaultParams.cashBalance;
            document.getElementById('defaultPositionSize').value = defaultParams.positionSize;
            modal.style.display = 'flex';
        }
    } else {
        createDefaultsModal();
        document.getElementById('defaultsModal').style.display = 'flex';
    }
}

function createDefaultsModal() {
    const modal = document.createElement('div');
    modal.id = 'defaultsModal';
    modal.innerHTML = `
        <div class="defaults-overlay" onclick="if(event.target === this) toggleDefaultsModal()">
            <div class="defaults-content">
                <h3>Default Values</h3>
                <div class="defaults-row">
                    <label>Cash Balance</label>
                    <input type="number" id="defaultCashBalance" value="${defaultParams.cashBalance}" min="1">
                </div>
                <div class="defaults-row">
                    <label>Position Size</label>
                    <input type="number" id="defaultPositionSize" value="${defaultParams.positionSize}" min="1">
                </div>
                <div class="defaults-buttons">
                    <button id="resetDefaultsBtn">Reset</button>
                    <button id="saveDefaultsBtn">Save</button>
                    <button id="closeDefaultsBtn">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
        .defaults-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex; align-items: center; justify-content: center;
            z-index: 3000;
        }
        .defaults-content {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 8px;
            min-width: 250px;
        }
        .defaults-content h3 {
            margin: 0 0 15px 0;
            text-align: center;
        }
        .defaults-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .defaults-row label { font-size: 14px; }
        .defaults-row input {
            width: 100px;
            padding: 5px;
            text-align: center;
            background: #1a1a1a;
            color: #ddd;
            border: 1px solid #444;
        }
        .defaults-buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
        }
        .defaults-buttons button {
            padding: 6px 12px;
            cursor: pointer;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);

    document.getElementById('resetDefaultsBtn').addEventListener('click', function() {
        defaultParams = { ...defaultSettings };
        document.getElementById('defaultCashBalance').value = defaultParams.cashBalance;
        document.getElementById('defaultPositionSize').value = defaultParams.positionSize;
    });

    document.getElementById('saveDefaultsBtn').addEventListener('click', function() {
        const cashVal = parseInt(document.getElementById('defaultCashBalance').value, 10);
        const posVal = parseInt(document.getElementById('defaultPositionSize').value, 10);
        defaultParams.cashBalance = cashVal > 0 ? cashVal : defaultSettings.cashBalance;
        defaultParams.positionSize = posVal > 0 ? posVal : defaultSettings.positionSize;
        saveDefaultParams();
    });

    document.getElementById('closeDefaultsBtn').addEventListener('click', toggleDefaultsModal);
}

function renderHotkeyInputs() {
    const list = document.getElementById('hotkeyList');
    const labels = {
        buy: 'Buy (Long)',
        sell: 'Sell (Short)',
        close: 'Close Position',
        stepForward: 'Step Forward',
        limitUp: 'Limit Up',
        limitDown: 'Limit Down',
        stopUp: 'Stop Up',
        stopDown: 'Stop Down',
        settings: 'Open Settings'
    };

    list.innerHTML = Object.keys(hotkeys).map(key => `
        <div class="hotkey-row">
            <label>${labels[key]}</label>
            <input type="text" maxlength="1" data-key="${key}" value="${hotkeys[key]}">
        </div>
    `).join('');

    list.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            const key = this.dataset.key;
            let val = this.value.toLowerCase();
            if (val.length > 1) val = val.slice(-1);
            this.value = val;
            hotkeys[key] = val || '?';
            saveHotkeys();
        });
    });
}

function initHotkeys() {
    loadHotkeys();
    loadDefaultParams();
    document.addEventListener('keydown', handleHotkey);
    if (typeof applyDefaultSettings === 'function') {
        applyDefaultSettings();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHotkeys);
} else {
    initHotkeys();
}

console.log("hotkeys.js loaded");
