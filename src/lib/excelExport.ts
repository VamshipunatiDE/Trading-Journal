import * as XLSX from 'xlsx';
import { Trade, UserSettings } from '../types';
import { calculateTradeMetrics, calculateAccountMetrics, fmtCurrency, fmtPct } from './calculations';

function makeTextSparkline(values: number[]): string {
  if (!values || values.length === 0) return 'No data';
  const blocks = [' ', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) return blocks[3].repeat(values.length);

  return values
    .map(v => {
      const idx = Math.min(7, Math.max(0, Math.floor(((v - min) / range) * 7)));
      return blocks[idx];
    })
    .join('');
}

function makeTextBar(val: number, maxVal: number, maxChars: number = 20): string {
  if (!maxVal || maxVal <= 0) return '';
  const count = Math.min(maxChars, Math.max(1, Math.round((Math.abs(val) / maxVal) * maxChars)));
  const prefix = val >= 0 ? '▲ ' : '▼ ';
  return prefix + '█'.repeat(count);
}

export function generateExcelReport(
  trades: Trade[],
  settings: UserSettings,
  startDateStr: string,
  endDateStr: string
): void {
  // Filter trades in range
  const filteredTrades = trades.filter(t => {
    if (!t.tradeDate) return false;
    if (startDateStr && t.tradeDate < startDateStr) return false;
    if (endDateStr && t.tradeDate > endDateStr) return false;
    return true;
  });

  const accountStats = calculateAccountMetrics(filteredTrades, settings);
  const currency = settings.currency || 'INR';

  // 1. SHEET 1: SUMMARY
  const summaryData = [
    ['TRADING JOURNAL PERFORMANCE REPORT'],
    ['Broker Name', settings.brokerName || 'N/A'],
    ['Trader Name', settings.name || 'Trader'],
    ['Report Period', `${startDateStr || 'All Time'} to ${endDateStr || 'All Time'}`],
    ['Generated On', new Date().toLocaleString()],
    [],
    ['HEADLINE STATISTICS'],
    ['Metric', 'Value'],
    ['Initial Capital', fmtCurrency(settings.initialCapital, currency)],
    ['Current Equity', fmtCurrency(accountStats.currentEquity, currency)],
    ['Overall Net Profit / Loss', fmtCurrency(accountStats.overallNetProfit, currency)],
    ['Account Growth %', fmtPct(accountStats.accountGrowthPct)],
    ['Total Trades Count', accountStats.totalTrades],
    ['Closed Positions', accountStats.closedPositions],
    ['Open Positions', accountStats.openPositions],
    ['Winning Trades', accountStats.winningTrades],
    ['Losing Trades', accountStats.losingTrades],
    ['Win Rate %', fmtPct(accountStats.winRatePct)],
    ['Profit Factor', accountStats.profitFactor.toFixed(2)],
    ['Average Winner', fmtCurrency(accountStats.avgWinner, currency)],
    ['Average Loser', fmtCurrency(accountStats.avgLoser, currency)],
    ['Largest Winner', fmtCurrency(accountStats.largestWinner, currency)],
    ['Largest Loser', fmtCurrency(accountStats.largestLoser, currency)],
    ['Average Risk:Reward Ratio', accountStats.avgRiskReward.toFixed(2)],
    ['Expectancy per Trade', fmtCurrency(accountStats.expectancy, currency)],
    ['Max Drawdown %', fmtPct(accountStats.maxDrawdownPct)]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

  // 2. SHEET 2: VISUAL REPORT
  const cumPnlValues = accountStats.equityCurve.map(e => e.cumulativePnl);
  const sparklineStr = makeTextSparkline(cumPnlValues);

  // Group Strategy PnLs
  const strategyPnLs: Record<string, number> = {};
  const stockPnLs: Record<string, number> = {};
  const sectorPnLs: Record<string, number> = {};

  filteredTrades.forEach(t => {
    if (t.status !== 'Closed') return;
    const m = calculateTradeMetrics(t);
    const pnl = m.netPnl;

    strategyPnLs[t.strategy || 'Other'] = (strategyPnLs[t.strategy || 'Other'] || 0) + pnl;
    stockPnLs[t.stockName] = (stockPnLs[t.stockName] || 0) + pnl;
    sectorPnLs[t.sector || 'Other'] = (sectorPnLs[t.sector || 'Other'] || 0) + pnl;
  });

  const maxStratAbs = Math.max(1, ...Object.values(strategyPnLs).map(Math.abs));
  const maxStockAbs = Math.max(1, ...Object.values(stockPnLs).map(Math.abs));
  const maxSectorAbs = Math.max(1, ...Object.values(sectorPnLs).map(Math.abs));

  const visualRows: (string | number)[][] = [
    ['VISUAL TEXT-BASED ANALYTICS REPORT'],
    ['Period Cumulative P&L Sparkline', sparklineStr],
    [],
    ['WIN / LOSS SPLIT'],
    ['Type', 'Count', 'Visual Bar'],
    ['Winning Trades', accountStats.winningTrades, '█'.repeat(accountStats.winningTrades)],
    ['Losing Trades', accountStats.losingTrades, '█'.repeat(accountStats.losingTrades)],
    [],
    ['STRATEGY PERFORMANCE'],
    ['Strategy', 'Net P&L', 'Visual Bar']
  ];

  Object.entries(strategyPnLs).forEach(([strat, pnl]) => {
    visualRows.push([strat, fmtCurrency(pnl, currency), makeTextBar(pnl, maxStratAbs)]);
  });

  visualRows.push([], ['TOP STOCKS PERFORMANCE'], ['Stock', 'Net P&L', 'Visual Bar']);
  Object.entries(stockPnLs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([stk, pnl]) => {
      visualRows.push([stk, fmtCurrency(pnl, currency), makeTextBar(pnl, maxStockAbs)]);
    });

  visualRows.push([], ['SECTOR PERFORMANCE'], ['Sector', 'Net P&L', 'Visual Bar']);
  Object.entries(sectorPnLs)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sec, pnl]) => {
      visualRows.push([sec, fmtCurrency(pnl, currency), makeTextBar(pnl, maxSectorAbs)]);
    });

  const wsVisual = XLSX.utils.aoa_to_sheet(visualRows);

  // 3. SHEET 3: TRADES TABLE
  const tradeHeaders = [
    'Trade ID',
    'Date',
    'Stock Symbol',
    'Sector',
    'Exchange',
    'Segment',
    'Direction',
    'Trade Type',
    'Strategy',
    'Entry Price',
    'Exit Price',
    'Quantity',
    'Capital Used',
    'Total Charges',
    'Net P&L',
    'ROI %',
    'R:R',
    'Status',
    'Emotion Before',
    'Emotion After',
    'Mistake Category',
    'Notes'
  ];

  const tradeRows = filteredTrades.map(t => {
    const m = calculateTradeMetrics(t);
    return [
      t.id,
      t.tradeDate,
      t.stockName + (t.segment === 'Options' && t.optionsIndex ? ` (${t.optionsIndex} ${t.strikePrice} ${t.optionType})` : ''),
      t.sector || '',
      t.exchange,
      t.segment,
      t.direction,
      t.tradeType,
      t.strategy,
      t.entryPrice,
      t.exitPrice || 0,
      t.quantity,
      t.capitalUsed,
      m.totalCharges,
      m.netPnl,
      m.roiPct.toFixed(2) + '%',
      m.riskRewardRatio > 0 ? `1:${m.riskRewardRatio.toFixed(1)}` : 'N/A',
      t.status,
      t.emotionBefore || '',
      t.emotionAfter || '',
      t.mistakeCategory || '',
      t.notes || ''
    ];
  });

  const wsTrades = XLSX.utils.aoa_to_sheet([tradeHeaders, ...tradeRows]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  XLSX.utils.book_append_sheet(wb, wsVisual, 'Visual Report');
  XLSX.utils.book_append_sheet(wb, wsTrades, 'Trades');

  // Generate file name
  const filename = `trading-report-${startDateStr || 'all'}-to-${endDateStr || 'all'}.xlsx`;
  XLSX.writeFile(wb, filename);
}
