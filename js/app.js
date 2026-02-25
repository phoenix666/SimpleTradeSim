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
        render();
    }
});

document.getElementById('stepForwardBtn').addEventListener('click', function() {
    if (candles.length > 0 && lastIndex < candles.length) {
        lastIndex++;
        render();
    }
});
