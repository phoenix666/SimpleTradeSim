const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

const CANDLE_COUNT = 20;
const PADDING_TOP = 0.1;
const PADDING_BOTTOM = 0.1;
const RIGHT_MARGIN = 0.1;
const GRID_LINES = 10;

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
    const chartHeight = canvas.height * (1 - RIGHT_MARGIN);
    return ((max - price) / (max - min)) * chartHeight;
}

function countDecimalDigits(num) {
  const numString = String(num);
  if (numString.includes('.')) {
    const parts = numString.split('.');
    return parts[1].length;
  } else {
    return 0;
  }
}
function roundTo(value, num) {
    if (!Number.isFinite(value)) return value;
    
    const factor = 10 ** num;
    return Math.round(value * factor * 2) / (factor * 2);
}
function render() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
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
    
    const chartWidth = canvas.width * (1 - RIGHT_MARGIN);
    const candleWidth = chartWidth / visibleCount;
    const bodyWidth = candleWidth * 0.8;
    const wickWidth = 1;
    
    let maxDecimalDigits = 0;
    
    for (let i = 0; i < visibleCount; i++) {
        const candle = candles[startIndex + i];
        const x = i * candleWidth + candleWidth / 2;
        
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#0f0' : '#f00';
        
        const highY = priceToY(candle.high, range);
        const lowY = priceToY(candle.low, range);
        const openY = priceToY(candle.open, range);
        const closeY = priceToY(candle.close, range);
        maxDecimalDigits = Math.max(maxDecimalDigits, countDecimalDigits(candle.close));
        
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
    
    const gridStart = range.max + (range.max - range.min) * 0.05;
    const gridEnd = range.min - (range.max - range.min) * 0.05;
    const gridStep = (gridStart - gridEnd) / (GRID_LINES - 1);
    const chartHeight = canvas.height * (1 - RIGHT_MARGIN);
    const gridX = chartWidth + 10;
    
    ctx.fillStyle = '#444';
    ctx.font = '10pt  monospace';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < GRID_LINES; i++) {
        const price = gridStart - i * gridStep;
        const y = ((i+1) / (GRID_LINES)) * chartHeight;
        const roundedPrice = roundTo(price, maxDecimalDigits);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartWidth, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        //ctx.fillStyle = '#888';
        //ctx.fillRect(canvas.width - 15, y - 5, 10, 10);
        
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.fillText(roundedPrice.toString(), gridX+10, y + 4);
    }
    
    /*ctx.fillStyle = '#333';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Показано: ${visibleCount} свечей | Индекс: ${startIndex} - ${lastIndex - 1}`, 10, 20);
    */
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
