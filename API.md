# API модулей

## db.js (IndexedDB)

- `openDB()` - Открывает/создает базу данных IndexedDB. Возвращает Promise.
- `clearCandles()` - Очищает все записи в хранилище свечей. Возвращает Promise.
- `addCandles(candles)` - Добавляет массив свечей в БД. `candles` - массив объектов {open, high, low, close}. Возвращает Promise.
- `getAllCandles()` - Получает все свечи из БД. Возвращает Promise с массивом свечей.
- `getCandleRange(start, count)` - Получает свечи с позиции `start` в количестве `count`. Возвращает Promise с массивом.
- `getCandleCount()` - Возвращает общее количество свечей в БД. Возвращает Promise с числом.

## parser.js (Парсинг файлов)

- `detectDelimiter(lines)` - Определяет разделитель в файле (;, ,, :, пробел, таб). `lines` - массив строк. Возвращает символ-разделитель.
- `parseValue(str)` - Парсит строку в число. Меняет запятую на точку. Возвращает число или null.
- `isValidOHLC(cols)` - Проверяет валидность значений OHLC (open, high, low, close). `cols` - массив из 4 значений. Возвращает boolean.
- `findOHLCColumns(rows, delimiter)` - Ищет индекс колонки, с которой начинаются 4 последовательные колонки с валидными OHLC. `rows` - массив строк, `delimiter` - разделитель. Возвращает индекс или -1.
- `loadCandles(file)` - Загружает свечи из файла. `file` - объект File из input. Асинхронная, вызывает `onCandlesLoaded(count)` после загрузки.

## chart.js (Отрисовка графика)

- `resizeCanvas()` - Изменяет размер canvas под контейнер и перерисовывает график.
- `getPriceRange(startIndex)` - Вычисляет мин/макс цены для видимых свечей. `startIndex` - конечный индекс. Возвращает {min, max}.
- `priceToY(price, range)` - Конвертирует цену в Y-координату на canvas. Возвращает число.
- `countDecimalDigits(num)` - Считает количество знаков после запятой. Возвращает число.
- `formatPrice(value, num)` - Форматирует число в строку с `num` знаками после запятой (дополняет нулями). Возвращает строку.
- `render()` - Основная функция отрисовки графика на canvas.
- `loadAndRender()` - Загружает свечи из БД и рендерит график. Асинхронная.
- `onCandlesLoaded(count)` - Коллбэк, вызывается после загрузки свечей. Перезапускает `loadAndRender()` и обновляет торговый дисплей.

## app.js (Приложение)

- `updateTradingDisplay()` - Обновляет отображение CashBalance, CurrentPosition и UnrealizedGain на странице.
- `validatePositionSize()` - Проверяет, что PositionSize не превышает 0.8 * CashBalance * Leverage. Если превышает - корректирует в меньшую сторону.
- `updateButtonState()` - Обновляет состояние кнопки "Очистить базу" (disabled если свечей нет). Возвращает количество свечей.
- `init()` - Инициализация приложения: открывает БД, обновляет состояние кнопок, загружает данные, инициализирует previousClosePrice.
- Обработчики событий:
  - `fileInput.change` - Запускает загрузку свечей при выборе файла.
  - `clearBtn.click` - Очищает базу и сбрасывает график.
  - `randomBtn.click` - Устанавливает случайный lastIndex, сбрасывает торговые переменные в начальные значения.
  - `stepForwardBtn.click` - Увеличивает lastIndex на 1, пересчитывает позицию пропорционально изменению цены.
  - `leverageSelect.change` - Обновляет leverage и валидирует PositionSize.
  - `positionSizeInput.input` - Обновляет positionSize и валидирует его.
  - `buyBtn.click` - Открывает длинную позицию: вычитает маржу из CashBalance, добавляет к CurrentPosition.
  - `sellBtn.click` - Закрывает позицию: возвращает маржу в CashBalance, обнуляет CurrentPosition.

## Глобальные переменные

### chart.js
- `candles` - Массив всех загруженных свечей.
- `lastIndex` - Индекс последней отображаемой свечи (конец диапазона).
- `previousClosePrice` - Цена закрытия предыдущей свечи (для расчета unrealized gain).
- `CANDLE_COUNT` - Количество видимых свечей на графике (20).
- `RIGHT_MARGIN` - Отступ справа (0.1).
- `GRID_LINES` - Количество линий сетки (10).

### app.js
- `cashBalance` - Текущий доступный баланс (начальное значение 10000).
- `leverage` - Кредитное плечо (10, 20, 50 или 100).
- `positionSize` - Размер позиции, которую хочет открыть пользователь.
- `currentPosition` - Текущий размер открытой позиции в единицах актива.
- `positionCostBasis` - Сумма всех "вложений" в позицию по цене открытия (сумма всех размеров при Buy).
- `positionMargin` - Сколько реально зарезервировано кэша из CashBalance под позицию.
- `unrealizedGain` - Нереализованная прибыль или убыток.
