# SimpleTradeSim

English | [Russian](#russian)

A highly simplified stock trading simulator. Load and visualize candlesticks in a browser with the ability to open positions, set stop-loss and take-profit. Run in a browser on PC, it will be inconvenient on mobile. No data is provided, load CSV/TXT files with Open-High-Low-Close data from your local device. There must be at least these 4 consecutive columns in the correct order. Others are ignored. Rows must already be sorted by date ascending (oldest first), the script cannot reorder them. The script does not account for sudden gaps with no liquidity, limits that don't trigger when they should, stops that trigger when they shouldn't, commissions, and other real trading nuances. Only the main concept works with a simplified algorithm, but it's simple to manage, fast, and requires no registration.

## Running

Copy `index.html` and `/js/` to any folder on your disk. Open `index.html` in your browser.

## Controls

- **Buy** - open Long or close Short
- **Sell** - open Short or close Long
- **Step Forward** - move to next candle, (stop/limit checks if any)
- **Random** - random position on chart, reset position
- **Drag & drop** - drag stop/limit lines on chart with mouse

## Structure

```
index.html
js/
  db.js      # IndexedDB operations
  parser.js  # CSV/TXT parsing
  chart.js   # canvas candlestick rendering
  app.js     # initialization and UI
API.md       # API documentation
```

## Features

- Load CSV/TXT files with automatic delimiter and O-H-L-C column detection
- Store data in IndexedDB (browser database)
- Candlestick visualization on canvas (black background, green/red candles)
- Open Long and Short positions
- Leverage (10x, 20x, 50x, 100x)
- Automatic stop-loss and take-profit calculation based on volatility
- Manual stop/limit placement by dragging lines on chart
- Auto close position when stop or limit is hit
- Step through candles (Step Forward)
- Random position on chart (Random)
- Operation log

## Data Format

```js
{
  id: number,      // auto-increment
  open: number,
  high: number,
  low: number,
  close: number
}
```

---

# SimpleTradeSim

<a name="russian"></a>

Очень упрощенный симулятор биржевой торговли. Загрузка и визуализация свечей в браузере с возможностью открытия позиций, установки стоп-лосса и тейк-профита. Запускать в браузере на PC, на телефоне будет неудобно. Данные не предоставляются, загружайте с локального устройства csv/txt файлы с Open-High-Low-Close данными. Должны быть как минимум эти 4 последовательных колонки в правильном порядке. Остальные игнорируются. Строки должны быть уже отсортированы по возрастанию даты (от старого в начале к новому в конце), скрипт не умеет менять их порядок. Скрипт не учитывает резкие скачки с отсутствием ликвидности, несрабатывающие когда надо лимиты, срабатывающие когда не надо стопы, комиссии,  и прочие нюансы реального трейдинга. Работает только основной концепт по упрощенному алгоритму, зато просто в управлении, быстро и без регистраций. 

## Запуск

Скопировать index.html и /js/ в любую папку на диске. Открыть `index.html` в браузере.

## Управление

- **Buy** - открыть Long или закрыть Short
- **Sell** - открыть Short или закрыть Long
- **Step Forward** - перейти к следующей свече, (проверяется стоп/лимит если есть)
- **Random** - случайная позиция на графике, сброс позиции
- **Drag & drop** - перетаскивание линий стопа/лимита на графике мышью

## Структура

```
index.html
js/
  db.js      # IndexedDB операции
  parser.js  # парсинг CSV/TXT
  chart.js   # canvas рендеринг свечей
  app.js     # инициализация и UI
API.md      # документация API
```

## Функции

- Загрузка CSV/TXT файлов с автоматическим определением разделителя и колонок O-H-L-C
- Хранение данных в IndexedDB (браузерная база)
- Визуализация свечей на canvas (чёрный фон, зелёные/красные свечи)
- Открытие длинных (Long) и коротких (Short) позиций
- Кредитное плечо (10x, 20x, 50x, 100x)
- Автоматический расчёт стоп-лосса и тейк-профита на основе волатильности
- Ручная установка стоп/лимита перетаскиванием линий на графике мышью
- Автоматическое закрытие позиции при достижении стопа или лимита
- Пошаговое продвижение по свечам (Step Forward)
- Случайная позиция на графике (Random)
- Лог операций

## Формат данных

```js
{
  id: number,      // автоинкремент
  open: number,
  high: number,
  low: number,
  close: number
}
```
