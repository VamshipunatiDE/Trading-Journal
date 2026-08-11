import React, { useState, useMemo } from 'react';
import { ShieldAlert, Calculator, AlertTriangle, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';
import { UserSettings, Trade } from '../types';
import { calculateAccountMetrics, fmtCurrency, fmtPct } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface RiskPageProps {
  settings?: UserSettings;
  trades?: Trade[];
}

export const RiskPage: React.FC<RiskPageProps> = ({
  settings,
  trades = []
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';
  const metrics = calculateAccountMetrics(trades, safeSettings);

  // Position Calculator Local Form State
  const [capital, setCapital] = useState<number>(safeSettings.initialCapital || 500000);
  const [riskPct, setRiskPct] = useState<number>(1.0); // 1% risk per trade
  const [entryPrice, setEntryPrice] = useState<number>(1000);
  const [stopLossPrice, setStopLossPrice] = useState<number>(970);
  const [targetPrice, setTargetPrice] = useState<number>(1090);
  const [lotSize, setLotSize] = useState<number>(1); // e.g. options lot size or stock multiples

  // Risk Calculator Output Calculations
  const calcOutput = useMemo(() => {
    const maxRiskAmount = (capital * riskPct) / 100;
    const priceRiskPerShare = Math.abs(entryPrice - stopLossPrice);
    const priceRewardPerShare = Math.abs(targetPrice - entryPrice);

    let maxShares = priceRiskPerShare > 0 ? Math.floor(maxRiskAmount / priceRiskPerShare) : 0;
    if (lotSize > 1 && maxShares > 0) {
      maxShares = Math.floor(maxShares / lotSize) * lotSize;
    }

    const totalCapitalRequired = maxShares * entryPrice;
    const actualRiskAmount = maxShares * priceRiskPerShare;
    const potentialRewardAmount = maxShares * priceRewardPerShare;
    const rrRatio = priceRiskPerShare > 0 ? priceRewardPerShare / priceRiskPerShare : 0;

    return {
      maxRiskAmount,
      priceRiskPerShare,
      maxShares,
      totalCapitalRequired,
      actualRiskAmount,
      potentialRewardAmount,
      rrRatio
    };
  }, [capital, riskPct, entryPrice, stopLossPrice, targetPrice, lotSize]);

  // Max Drawdown limit evaluation
  const isDailyLimitBreached = Math.abs(metrics.todaysPnl) > (capital * (safeSettings.maxDailyLossPct ?? 2)) / 100 && metrics.todaysPnl < 0;
  const isWeeklyLimitBreached = Math.abs(metrics.weeklyPnl) > (capital * (safeSettings.maxWeeklyLossPct ?? 5)) / 100 && metrics.weeklyPnl < 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Risk & Position Sizing Calculator
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Exact mathematical position sizing based on account equity risk tolerance
          </p>
        </div>
      </div>

      {/* Safety & Drawdown Breach Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Risk Threshold */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
          isDailyLimitBreached
            ? 'bg-red-500/10 border-red-500/40 text-red-300'
            : 'bg-[#12161E] border-gray-800 text-gray-300'
        }`}>
          {isDailyLimitBreached ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#3ED9B8] shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-semibold text-sm text-white">Daily Loss Threshold ({settings.maxDailyLossPct}%)</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Today's P&L: <strong className={metrics.todaysPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}>{fmtCurrency(metrics.todaysPnl, currency)}</strong> (Max Allowed: {fmtCurrency((capital * settings.maxDailyLossPct) / 100, currency)})
            </p>
          </div>
        </div>

        {/* Weekly Risk Threshold */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
          isWeeklyLimitBreached
            ? 'bg-red-500/10 border-red-500/40 text-red-300'
            : 'bg-[#12161E] border-gray-800 text-gray-300'
        }`}>
          {isWeeklyLimitBreached ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#3ED9B8] shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-semibold text-sm text-white">Weekly Loss Threshold ({settings.maxWeeklyLossPct}%)</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Weekly P&L: <strong className={metrics.weeklyPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}>{fmtCurrency(metrics.weeklyPnl, currency)}</strong> (Max Allowed: {fmtCurrency((capital * settings.maxWeeklyLossPct) / 100, currency)})
            </p>
          </div>
        </div>
      </div>

      {/* Main Position Sizing Calculator Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: Inputs Form */}
        <div className="lg:col-span-6 bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl space-y-4">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#3ED9B8]" />
            Position Parameters
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Trading Account Capital ({currency})</label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Maximum Risk Tolerance per Trade (%)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.25"
                  max="5.0"
                  step="0.25"
                  value={riskPct}
                  onChange={e => setRiskPct(parseFloat(e.target.value) || 1)}
                  className="w-full accent-[#3ED9B8]"
                />
                <span className="font-mono font-bold text-sm text-[#3ED9B8] w-14 text-right">{riskPct}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Planned Entry Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={entryPrice}
                  onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Planned Stop Loss ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={stopLossPrice}
                  onChange={e => setStopLossPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-[#E28B5C] focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Planned Target Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={targetPrice}
                  onChange={e => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-[#3ED9B8] focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Options Lot Size / Multiplier</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={e => setLotSize(parseInt(e.target.value) || 1)}
                  placeholder="1 for Equity, 25 for Nifty, 15 for BankNifty"
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Calculated Position Results */}
        <div className="lg:col-span-6 bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-display font-semibold text-base text-white mb-3">
              Recommended Position Allocation
            </h3>

            <div className="space-y-3 text-xs">
              <div className="bg-[#191F2A] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[11px]">Recommended Shares / Quantity</span>
                  <span className="font-mono font-extrabold text-2xl text-[#3ED9B8]">
                    {calcOutput.maxShares} {lotSize > 1 ? `(${calcOutput.maxShares / lotSize} lots)` : 'qty'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[11px]">Required Capital</span>
                  <span className="font-mono font-bold text-sm text-white">
                    {fmtCurrency(calcOutput.totalCapitalRequired, currency)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161B24] p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block mb-1">Max Risk Amount ({riskPct}%)</span>
                  <span className="font-mono font-bold text-sm text-[#E28B5C]">
                    {fmtCurrency(calcOutput.actualRiskAmount, currency)}
                  </span>
                </div>

                <div className="bg-[#161B24] p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block mb-1">Potential Profit Reward</span>
                  <span className="font-mono font-bold text-sm text-[#3ED9B8]">
                    {fmtCurrency(calcOutput.potentialRewardAmount, currency)}
                  </span>
                </div>
              </div>

              <div className="bg-[#161B24] p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                <span className="text-gray-400">Risk : Reward Ratio</span>
                <span className="font-mono font-bold text-base text-[#D9B968]">
                  {calcOutput.rrRatio > 0 ? `1 : ${calcOutput.rrRatio.toFixed(2)}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#191F2A] border border-gray-800 rounded-xl text-[11px] text-gray-400">
            <strong>Golden Rule:</strong> Never risk more than 1-2% of your account on any single setup regardless of market excitement.
          </div>
        </div>
      </div>
    </div>
  );
};
