import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, Award, ShieldAlert, Clock, TrendingUp } from 'lucide-react';
import { Trade, UserSettings } from '../types';
import { calculateTradeMetrics, calculateAccountMetrics, fmtCurrency, fmtPct } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface AnalyticsPageProps {
  trades?: Trade[];
  settings?: UserSettings;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  trades = [],
  settings
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';
  const metrics = calculateAccountMetrics(trades, safeSettings);

  // 1. Strategy Breakdown Chart Data
  const strategyData = useMemo(() => {
    const map: Record<string, { strategy: string; netPnl: number; count: number; wins: number }> = {};

    trades.forEach(t => {
      if (t.status !== 'Closed') return;
      const strat = t.strategy || 'Other';
      if (!map[strat]) map[strat] = { strategy: strat, netPnl: 0, count: 0, wins: 0 };

      const m = calculateTradeMetrics(t);
      map[strat].netPnl += m.netPnl;
      map[strat].count++;
      if (m.netPnl > 0) map[strat].wins++;
    });

    return Object.values(map).map(d => ({
      ...d,
      winRate: d.count > 0 ? (d.wins / d.count) * 100 : 0
    }));
  }, [trades]);

  // 2. Segment Distribution Pie Data
  const segmentData = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach(t => {
      map[t.segment] = (map[t.segment] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [trades]);

  // 3. Direction Long vs Short Performance
  const directionData = useMemo(() => {
    let longPnl = 0;
    let shortPnl = 0;
    let longCount = 0;
    let shortCount = 0;

    trades.forEach(t => {
      if (t.status !== 'Closed') return;
      const m = calculateTradeMetrics(t);
      if (t.direction === 'Long') {
        longPnl += m.netPnl;
        longCount++;
      } else {
        shortPnl += m.netPnl;
        shortCount++;
      }
    });

    return [
      { name: 'Long Positions', pnl: longPnl, count: longCount },
      { name: 'Short Positions', pnl: shortPnl, count: shortCount }
    ];
  }, [trades]);

  // 4. Mistake Distribution
  const mistakeData = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach(t => {
      const mist = t.mistakeCategory || 'None';
      map[mist] = (map[mist] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [trades]);

  // 5. Sector Wise Performance Table Data
  const sectorData = useMemo(() => {
    const map: Record<string, { sector: string; netPnl: number; count: number; wins: number }> = {};

    trades.forEach(t => {
      if (t.status !== 'Closed') return;
      const sec = t.sector || 'Other';
      if (!map[sec]) map[sec] = { sector: sec, netPnl: 0, count: 0, wins: 0 };

      const m = calculateTradeMetrics(t);
      map[sec].netPnl += m.netPnl;
      map[sec].count++;
      if (m.netPnl > 0) map[sec].wins++;
    });

    return Object.values(map).sort((a, b) => b.netPnl - a.netPnl);
  }, [trades]);

  const PIE_COLORS = ['#3ED9B8', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Performance Analytics Engine
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Data-driven strategy evaluation, mistake tracking, & edge analysis
          </p>
        </div>
      </div>

      {/* Overview Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#12161E] border border-gray-800 p-4 rounded-2xl text-xs">
        <div>
          <span className="text-gray-400 block mb-1">Profit Factor</span>
          <span className="font-mono font-extrabold text-base text-[#3ED9B8]">{metrics.profitFactor.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-1">Expectancy / Trade</span>
          <span className={`font-mono font-extrabold text-base ${metrics.expectancy >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
            {fmtCurrency(metrics.expectancy, currency)}
          </span>
        </div>
        <div>
          <span className="text-gray-400 block mb-1">Win Rate %</span>
          <span className="font-mono font-extrabold text-base text-white">{fmtPct(metrics.winRatePct, 1)}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-1">Average Risk:Reward</span>
          <span className="font-mono font-extrabold text-base text-[#D9B968]">
            {metrics.avgRiskReward > 0 ? `1 : ${metrics.avgRiskReward.toFixed(2)}` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Grid Row 1: Strategy P&L Bar Chart */}
      <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-base text-white">Net P&L by Trading Strategy</h3>
            <p className="text-xs text-gray-400">Total accumulated net profit generated per setup strategy</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2633" />
              <XAxis dataKey="strategy" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161E',
                  borderColor: '#2A3447',
                  borderRadius: '12px',
                  color: '#FFFFFF'
                }}
                formatter={(val: any) => [fmtCurrency(Number(val), currency), 'Net P&L']}
              />
              <Bar dataKey="netPnl" fill="#3ED9B8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Row 2: Segment Breakdown & Direction Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Segment Pie Chart */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm">
          <h3 className="font-display font-semibold text-base text-white mb-1">Trades Volume by Segment</h3>
          <p className="text-xs text-gray-400 mb-4">Distribution across Equity, F&O, Options, Futures</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12161E',
                    borderColor: '#2A3447',
                    borderRadius: '12px',
                    color: '#FFFFFF'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direction Long vs Short Cards */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-semibold text-base text-white mb-1">Long vs Short Direction Edge</h3>
            <p className="text-xs text-gray-400 mb-4">Comparing performance metrics of BUY vs SELL trades</p>

            <div className="space-y-4">
              {directionData.map(dir => (
                <div key={dir.name} className="bg-[#191F2A] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-white block">{dir.name}</span>
                    <span className="text-xs text-gray-400">{dir.count} Executed Positions</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold text-base ${dir.pnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
                      {fmtCurrency(dir.pnl, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 3: Mistakes Category Analysis & Sector P&L */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mistakes List */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm">
          <h3 className="font-display font-semibold text-base text-white mb-1">Trading Mistakes Logged</h3>
          <p className="text-xs text-gray-400 mb-4">Frequency breakdown of rule violations & mistakes</p>

          <div className="space-y-2.5">
            {mistakeData.map(m => (
              <div key={m.name} className="flex items-center justify-between bg-[#161B24] p-3 rounded-xl border border-gray-800 text-xs">
                <span className={`font-medium ${m.name === 'None' ? 'text-[#3ED9B8]' : 'text-gray-300'}`}>
                  {m.name === 'None' ? '✓ Followed Trading Plan' : m.name}
                </span>
                <span className="font-mono font-bold text-white bg-gray-800 px-2.5 py-0.5 rounded-full">
                  {m.value} times
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sector wise table */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm">
          <h3 className="font-display font-semibold text-base text-white mb-1">Sector Wise P&L Breakdown</h3>
          <p className="text-xs text-gray-400 mb-4">Sectors generating highest net returns</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-medium">
                  <th className="py-2 px-2">Sector</th>
                  <th className="py-2 px-2 text-center">Trades</th>
                  <th className="py-2 px-2 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sectorData.map(s => (
                  <tr key={s.sector}>
                    <td className="py-2.5 px-2 font-medium text-white">{s.sector}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-gray-400">{s.count}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold">
                      <span className={s.netPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}>
                        {fmtCurrency(s.netPnl, currency)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
