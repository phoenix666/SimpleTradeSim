const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

const CANDLE_COUNT = 20;
const PADDING_TOP = 0.1;
const PADDING_BOTTOM = 0.1;

let candles = [];
let lastIndex = 0;

function resizeCanvas() {
    const container = document.getElementById('chartContainer');
    canvas.width = Math.max(container.clientWidth, 1000);
    canvas.height = 800;
    render();
}

function getPriceRange(startIndex) {
    const end = Math.min(startIndex, candles.length);
    const begin = Math.max(0, end - CANDLE_COUNT);
    const visible = candles.slice(begin, end);
    
    let min = Infinity, max = -Infinity;
    for (const c of visible) {
        if (c.low < min) min = c.low;
        if (c.high > max) max = c.high;
    }
    
    const range = max - min;
    return {
        min: min - range * PADDING_TOP,
        max: max + range * PADDING_TOP
    };
}

function priceToY(price, range) {
    const { min, max } = range;
    return ((max - price) / (max - min)) * canvas.height;
}

function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (candles.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Загрузите данные', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const visibleCount = Math.min(CANDLE_COUNT, lastIndex);
    const startIndex = lastIndex - visibleCount;
    const range = getPriceRange(lastIndex);
    
    const candleWidth = canvas.width / visibleCount;
    const bodyWidth = candleWidth * 0.8;
    const wickWidth = 1;
    
    for (let i = 0; i < visibleCount; i++) {
        const candle = candles[startIndex + i];
        const x = i * candleWidth + candleWidth / 2;
        
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#0f0' : '#f00';
        
        const highY = priceToY(candle.high, range);
        const lowY = priceToY(candle.low, range);
        const openY = priceToY(candle.open, range);
        const closeY = priceToY(candle.close, range);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = wickWidth;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY) || 1;
        
        ctx.fillStyle = color;
        ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    }
    
    ctx.fillStyle = '#333';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Показано: ${visibleCount} свечей | Индекс: ${startIndex} - ${lastIndex - 1}`, 10, 20);
}

async function loadAndRender() {
    const count = await getCandleCount();
    if (count > 0) {
        candles = await getAllCandles();
        lastIndex = candles.length;
        render();
    }
}

function onCandlesLoaded(count) {
    loadAndRender();
}

window.addEventListener('resize', resizeCanvas);
