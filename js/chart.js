const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

const CANDLE_COUNT = 20;
const PADDING_TOP = 0.1;
const PADDING_BOTTOM = 0.1;
const RIGHT_MARGIN = 0.1;
const GRID_LINES = 10;

let candles = [];
let lastIndex = 0;
let stopLoss = 0;
let profitLimit = 0;
let draggingLine = null;
let currentRange = null;
let maxDecimalDigits = 0;

const DRAG_THRESHOLD = 10;

function setStopLimit(stop, limit) {
    stopLoss = stop;
    profitLimit = limit;
    if (candles.length > 0) {
        render();
    }
}

function clearStopLimit() {
    stopLoss = 0;
    profitLimit = 0;
}

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
    
    if (stopLoss > 0 && (stopLoss < min || stopLoss > max)) {
        min = Math.min(min, stopLoss);
        max = Math.max(max, stopLoss);
    }
    if (profitLimit > 0 && (profitLimit < min || profitLimit > max)) {
        min = Math.min(min, profitLimit);
        max = Math.max(max, profitLimit);
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

function yToPrice(y, range) {
    const { min, max } = range;
    const chartHeight = canvas.height * (1 - RIGHT_MARGIN);
    return max - (y / chartHeight) * (max - min);
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
function formatPrice(value, num) {
    if (!Number.isFinite(value)) return value;
    
    return value.toFixed(num);
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
        ctx.fillText('Load some Candles Data', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const visibleCount = Math.min(CANDLE_COUNT, lastIndex);
    const startIndex = lastIndex - visibleCount;
    const range = getPriceRange(lastIndex);
    currentRange = range;
    
    const chartWidth = canvas.width * (1 - RIGHT_MARGIN);
    const candleWidth = chartWidth / visibleCount;
    const bodyWidth = candleWidth * 0.8;
    const wickWidth = 1;
    //maxDecimalDigits = 0;
    for (let i = 0; i < visibleCount; i++) {
        const candle = candles[startIndex + i];
        const x = i * candleWidth + candleWidth / 2;
        
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? '#0f0' : '#f00';
        
        const highY = priceToY(candle.high, range);
        const lowY = priceToY(candle.low, range);
        const openY = priceToY(candle.open, range);
        const closeY = priceToY(candle.close, range);
        //maxDecimalDigits = Math.max(maxDecimalDigits, countDecimalDigits(candle.close));
        
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
    
    const gridStart = range.max;
    const gridEnd = range.min;
    const gridStep = (gridStart - gridEnd) / (GRID_LINES - 1);
    const chartHeight = canvas.height * (1 - RIGHT_MARGIN);
    const gridX = chartWidth + 10;
    
    ctx.fillStyle = '#444';
    ctx.font = '10pt  monospace';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < GRID_LINES; i++) {
        const price = gridStart - i * gridStep;
        const y = priceToY(price, range);
        const formattedPrice = formatPrice(price, maxDecimalDigits);
        
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
        ctx.fillText(formattedPrice, gridX+10, y + 4);
    }

    if (stopLoss > 0) {
        const stopY = priceToY(stopLoss, range);
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, stopY);
        ctx.lineTo(chartWidth, stopY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#f00';
        ctx.font = '10pt monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(stopLoss, maxDecimalDigits), chartWidth * 0.7, stopY - 5);
    }
    
    if (profitLimit > 0) {
        const limitY = priceToY(profitLimit, range);
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, limitY);
        ctx.lineTo(chartWidth, limitY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#0f0';
        ctx.font = '10pt monospace';
        ctx.textAlign = 'left';
        ctx.fillText(formatPrice(profitLimit, maxDecimalDigits), chartWidth * 0.7, limitY - 5);
    }
    
    /*ctx.fillStyle = '#333';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Показано: ${visibleCount} свечей | Индекс: ${startIndex} - ${lastIndex - 1}`, 10, 20);
    */
}

function findMeaningfulDigits()
{
    let step = 1;
    if(lastIndex>1000) step = Math.round(lastIndex/1000);
    let arr = []
    for(i = 0;i<lastIndex;i+=step) 
    {
        let t = countDecimalDigits(candles[i].close);
        if(t>8) continue;
        if(arr[t]===undefined) arr[t] = 1;
        else arr[t]++;
    }
    let max = 0;
    for(i = 0;i<arr.length;i++)
    {
        console.log(" "+i+" "+arr[i]);
        if(arr[i]===undefined) continue;
        if(max<arr[i])
        {
            max = arr[i];
            maxDecimalDigits = i;
        }
    }
}

async function loadAndRender() {
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    loading.classList.add('show');
    loadingText.textContent = 'Preparing data...';
    
    const count = await getCandleCount();
    if (count > 0) {
        candles = await getAllCandles();
        lastIndex = Math.min(CANDLE_COUNT, candles.length);
        findMeaningfulDigits();
        render();
    }
    
    loading.classList.remove('show');
}

function onCandlesLoaded(count) {
    loadAndRender();
    if (typeof updateButtonState === 'function') updateButtonState();
    if (typeof updateTradingDisplay === 'function' && candles.length > 0 && lastIndex > 0) {
        updateTradingDisplay();
    }
}

window.addEventListener('resize', resizeCanvas);

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr
    };
}

canvas.addEventListener('mousedown', function(e) {
    if (candles.length === 0 || !currentRange) return;
    
    const pos = getMousePos(e);
    const chartHeight = canvas.height * (1 - RIGHT_MARGIN);
    
    if (pos.y > chartHeight) return;
    
    if (stopLoss > 0) {
        const stopY = priceToY(stopLoss, currentRange);
        if (Math.abs(pos.y - stopY) < DRAG_THRESHOLD) {
            draggingLine = 'stop';
            canvas.style.cursor = 'ns-resize';
            return;
        }
    }
    
    if (profitLimit > 0) {
        const limitY = priceToY(profitLimit, currentRange);
        if (Math.abs(pos.y - limitY) < DRAG_THRESHOLD) {
            draggingLine = 'limit';
            canvas.style.cursor = 'ns-resize';
            return;
        }
    }
});

canvas.addEventListener('mousemove', function(e) {
    if (candles.length === 0 || !currentRange) return;
    
    const pos = getMousePos(e);
    const chartHeight = canvas.height * (1 - RIGHT_MARGIN);
    
    if (draggingLine) {
        const newPrice = yToPrice(pos.y, currentRange);
        //const digits = countDecimalDigits(candles[lastIndex - 1]?.close || 0);
        const roundedPrice = parseFloat(newPrice.toFixed(maxDecimalDigits)); //digits
        
        if (draggingLine === 'stop') {
            stopLoss = roundedPrice;
        } else if (draggingLine === 'limit') {
            profitLimit = roundedPrice;
        }
        render();
        return;
    }
    
    let hovered = false;
    if (stopLoss > 0) {
        const stopY = priceToY(stopLoss, currentRange);
        if (Math.abs(pos.y - stopY) < DRAG_THRESHOLD) {
            hovered = true;
        }
    }
    if (profitLimit > 0) {
        const limitY = priceToY(profitLimit, currentRange);
        if (Math.abs(pos.y - limitY) < DRAG_THRESHOLD) {
            hovered = true;
        }
    }
    
    canvas.style.cursor = hovered ? 'ns-resize' : 'default';
});

canvas.addEventListener('mouseup', function() {
    if (draggingLine) {
        if (typeof updateTradingDisplay === 'function') {
            updateTradingDisplay();
        }
        draggingLine = null;
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('mouseleave', function() {
    if (draggingLine) {
        draggingLine = null;
        canvas.style.cursor = 'default';
    }
});

console.log("chart.js loaded");
