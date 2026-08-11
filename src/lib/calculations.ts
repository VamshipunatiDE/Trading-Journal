import { Trade, TradeCharges, TradeCalculations, UserSettings, CurrencyCode } from '../types';
import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€'
};

export function fmtCurrency(amount: number, currency: CurrencyCode = 'INR', decimals: number = 2): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const isNeg = amount < 0;
  const absVal = Math.abs(amount);
  
  let formatted = absVal.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${isNeg ? '-' : ''}${symbol}${formatted}`;
}

export function fmtPct(val: number, decimals: number = 2): string {
  const isPos = val > 0;
  const prefix = isPos ? '+' : '';
  return `${prefix}${val.toFixed(decimals)}%`;
}

export function calculateTradeMetrics(trade: Partial<Trade>): TradeCalculations {
  const direction = trade.direction || 'Long';
  const entryPrice = trade.entryPrice || 0;
  const exitPrice = trade.exitPrice || 0;
  const quantity = trade.quantity || 0;
  const capitalUsed = trade.capitalUsed || (entryPrice * quantity) || 1;
  const charges = trade.charges || {
    brokerage: 0,
    exchangeCharges: 0,
    gst: 0,
    stt: 0,
    sebiCharges: 0,
    stampDuty: 0,
    otherCharges: 0
  };

  const totalCharges =
    (charges.brokerage || 0) +
    (charges.exchangeCharges || 0) +
    (charges.gst || 0) +
    (charges.stt || 0) +
    (charges.sebiCharges || 0) +
    (charges.stampDuty || 0) +
    (charges.otherCharges || 0);

  const multiplier = direction === 'Long' ? 1 : -1;
  const isClosed = trade.status === 'Closed' && exitPrice > 0;

  const grossPnl = isClosed ? (exitPrice - entryPrice) * quantity * multiplier : 0;
  const netPnl = grossPnl - totalCharges;
  const roiPct = capitalUsed > 0 ? (netPnl / capitalUsed) * 100 : 0;

  const stopLoss = trade.stopLoss || 0;
  const target = trade.target || 0;

  const riskAmount = stopLoss > 0 ? Math.abs(entryPrice - stopLoss) * quantity : 0;
  const rewardAmount = target > 0 ? Math.abs(target - entryPrice) * quantity : 0;
  const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

  let holdingTimeMins: number | undefined;
  if (trade.entryTime && trade.exitTime) {
    const [eH, eM] = trade.entryTime.split(':').map(Number);
    const [xH, xM] = trade.exitTime.split(':').map(Number);
    if (!isNaN(eH) && !isNaN(eM) && !isNaN(xH) && !isNaN(xM)) {
      const entryMinutes = eH * 60 + eM;
      const exitMinutes = xH * 60 + xM;
      holdingTimeMins = Math.max(0, exitMinutes - entryMinutes);
    }
  }

  return {
    grossPnl,
    totalCharges,
    netPnl,
    roiPct,
    riskAmount,
    rewardAmount,
    riskRewardRatio,
    holdingTimeMins,
    isWin: netPnl > 0
  };
}

export function formatHoldingTime(mins?: number): string {
  if (mins === undefined || isNaN(mins)) return 'N/A';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export interface AccountSummaryMetrics {
  todaysPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  quarterlyPnl: number;
  halfYearlyPnl: number;
  yearlyPnl: number;
  overallNetProfit: number;
  currentEquity: number;
  totalTrades: number;
  openPositions: number;
  closedPositions: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  profitFactor: number;
  avgWinner: number;
  avgLoser: number;
  largestWinner: number;
  largestLoser: number;
  avgRiskReward: number;
  expectancy: number;
  avgHoldingTimeMins: number;
  currentDrawdownPct: number;
  maxDrawdownPct: number;
  accountGrowthPct: number;
  equityCurve: { date: string; equity: number; netPnl: number; cumulativePnl: number }[];
}

export function calculateAccountMetrics(trades: Trade[] = [], settings?: UserSettings): AccountSummaryMetrics {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const initialCapital = safeSettings.initialCapital ?? 100000;
  const todayStr = new Date().toISOString().split('T')[0];

  const now = new Date();
  const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Date thresholds
  const dayOfWeek = todayObj.getDay(); // 0 is Sunday
  const startOfWeek = new Date(todayObj);
  startOfWeek.setDate(todayObj.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const startOfHalfYear = new Date(now.getFullYear(), now.getMonth() >= 6 ? 6 : 0, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let todaysPnl = 0;
  let weeklyPnl = 0;
  let monthlyPnl = 0;
  let quarterlyPnl = 0;
  let halfYearlyPnl = 0;
  let yearlyPnl = 0;

  let openPositions = 0;
  let closedPositions = 0;
  let winningTrades = 0;
  let losingTrades = 0;

  let grossWins = 0;
  let grossLosses = 0;
  let totalWinnerPnl = 0;
  let totalLoserPnl = 0;

  let largestWinner = 0;
  let largestLoser = 0;

  let sumRiskReward = 0;
  let countRiskReward = 0;

  let sumHoldingTime = 0;
  let countHoldingTime = 0;

  // Sort trades chronologically
  const sortedTrades = [...trades].sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

  // Equity Curve Calculation
  let runningPnl = 0;
  let peakEquity = initialCapital;
  let maxDrawdownPct = 0;
  let currentDrawdownPct = 0;

  const equityCurve: { date: string; equity: number; netPnl: number; cumulativePnl: number }[] = [
    { date: 'Initial', equity: initialCapital, netPnl: 0, cumulativePnl: 0 }
  ];

  sortedTrades.forEach(trade => {
    if (trade.status === 'Open') {
      openPositions++;
      return;
    }
    if (trade.status === 'Cancelled') return;

    closedPositions++;
    const metrics = calculateTradeMetrics(trade);
    const netPnl = metrics.netPnl;
    const tradeDateObj = new Date(trade.tradeDate);

    // Period P&L
    if (trade.tradeDate === todayStr) todaysPnl += netPnl;
    if (tradeDateObj >= startOfWeek) weeklyPnl += netPnl;
    if (tradeDateObj >= startOfMonth) monthlyPnl += netPnl;
    if (tradeDateObj >= startOfQuarter) quarterlyPnl += netPnl;
    if (tradeDateObj >= startOfHalfYear) halfYearlyPnl += netPnl;
    if (tradeDateObj >= startOfYear) yearlyPnl += netPnl;

    if (netPnl > 0) {
      winningTrades++;
      grossWins += metrics.grossPnl;
      totalWinnerPnl += netPnl;
      if (netPnl > largestWinner) largestWinner = netPnl;
    } else if (netPnl < 0) {
      losingTrades++;
      grossLosses += Math.abs(metrics.grossPnl);
      totalLoserPnl += netPnl;
      if (netPnl < largestLoser) largestLoser = netPnl;
    }

    if (metrics.riskRewardRatio > 0) {
      sumRiskReward += metrics.riskRewardRatio;
      countRiskReward++;
    }

    if (metrics.holdingTimeMins !== undefined) {
      sumHoldingTime += metrics.holdingTimeMins;
      countHoldingTime++;
    }

    runningPnl += netPnl;
    const currentEq = initialCapital + runningPnl;
    if (currentEq > peakEquity) {
      peakEquity = currentEq;
    }
    const dd = peakEquity > 0 ? ((peakEquity - currentEq) / peakEquity) * 100 : 0;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    currentDrawdownPct = dd;

    equityCurve.push({
      date: trade.tradeDate,
      equity: currentEq,
      netPnl,
      cumulativePnl: runningPnl
    });
  });

  const totalTrades = trades.length;
  const overallNetProfit = runningPnl;
  const currentEquity = initialCapital + overallNetProfit;
  const winRatePct = closedPositions > 0 ? (winningTrades / closedPositions) * 100 : 0;
  const winRatioDecimal = winRatePct / 100;
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 99.9 : 0;

  const avgWinner = winningTrades > 0 ? totalWinnerPnl / winningTrades : 0;
  const avgLoser = losingTrades > 0 ? Math.abs(totalLoserPnl) / losingTrades : 0;
  const avgRiskReward = countRiskReward > 0 ? sumRiskReward / countRiskReward : 0;

  // Expectancy = (Win Rate * Avg Winner) - ((1 - Win Rate) * Avg Loser)
  const expectancy = (winRatioDecimal * avgWinner) - ((1 - winRatioDecimal) * avgLoser);
  const avgHoldingTimeMins = countHoldingTime > 0 ? sumHoldingTime / countHoldingTime : 0;
  const accountGrowthPct = initialCapital > 0 ? (overallNetProfit / initialCapital) * 100 : 0;

  return {
    todaysPnl,
    weeklyPnl,
    monthlyPnl,
    quarterlyPnl,
    halfYearlyPnl,
    yearlyPnl,
    overallNetProfit,
    currentEquity,
    totalTrades,
    openPositions,
    closedPositions,
    winningTrades,
    losingTrades,
    winRatePct,
    profitFactor,
    avgWinner,
    avgLoser,
    largestWinner,
    largestLoser,
    avgRiskReward,
    expectancy,
    avgHoldingTimeMins,
    currentDrawdownPct,
    maxDrawdownPct,
    accountGrowthPct,
    equityCurve
  };
}
