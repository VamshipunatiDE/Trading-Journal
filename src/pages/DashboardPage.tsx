import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  BarChart2,
  PieChart,
  Clock,
  Shield,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Trade, UserSettings } from '../types';
import { calculateAccountMetrics, fmtCurrency, fmtPct, formatHoldingTime } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface DashboardPageProps {
  trades?: Trade[];
  settings?: UserSettings;
  onNewTrade?: () => void;
  onOpenNewTrade?: () => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  trades = [],
  settings,
  onNewTrade,
  onOpenNewTrade,
  onEditTrade
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';
  const metrics = calculateAccountMetrics(trades, safeSettings);
  const handleNewTradeClick = onNewTrade || onOpenNewTrade || (() => {});

  // ~25 KPI Cards Data Array
  const kpiList = [
    { label: "Today's P&L", value: fmtCurrency(metrics.todaysPnl, currency), isPos: metrics.todaysPnl >= 0, icon: Activity },
    { label: 'Weekly P&L', value: fmtCurrency(metrics.weeklyPnl, currency), isPos: metrics.weeklyPnl >= 0, icon: TrendingUp },
    { label: 'Monthly P&L', value: fmtCurrency(metrics.monthlyPnl, currency), isPos: metrics.monthlyPnl >= 0, icon: BarChart2 },
    { label: 'Quarterly P&L', value: fmtCurrency(metrics.quarterlyPnl, currency), isPos: metrics.quarterlyPnl >= 0, icon: BarChart2 },
    { label: 'Half-Yearly P&L', value: fmtCurrency(metrics.halfYearlyPnl, currency), isPos: metrics.halfYearlyPnl >= 0, icon: BarChart2 },
    { label: 'Yearly P&L', value: fmtCurrency(metrics.yearlyPnl, currency), isPos: metrics.yearlyPnl >= 0, icon: BarChart2 },
    { label: 'Overall Net Profit', value: fmtCurrency(metrics.overallNetProfit, currency), isPos: metrics.overallNetProfit >= 0, icon: DollarSign },
    { label: 'Current Equity', value: fmtCurrency(metrics.currentEquity, currency), isPos: true, icon: Shield },
    { label: 'Account Growth', value: fmtPct(metrics.accountGrowthPct), isPos: metrics.accountGrowthPct >= 0, icon: TrendingUp },
    { label: 'Total Trades', value: metrics.totalTrades, isPos: true, icon: PieChart },
    { label: 'Closed Positions', value: metrics.closedPositions, isPos: true, icon: PieChart },
    { label: 'Open Positions', value: metrics.openPositions, isPos: metrics.openPositions === 0, icon: Activity },
    { label: 'Winning Trades', value: metrics.winningTrades, isPos: true, icon: Award },
    { label: 'Losing Trades', value: metrics.losingTrades, isPos: false, icon: TrendingDown },
    { label: 'Win Rate %', value: fmtPct(metrics.winRatePct, 1), isPos: metrics.winRatePct >= 50, icon: Award },
    { label: 'Profit Factor', value: metrics.profitFactor.toFixed(2), isPos: metrics.profitFactor >= 1.5, icon: Award },
    { label: 'Average Winner', value: fmtCurrency(metrics.avgWinner, currency), isPos: true, icon: TrendingUp },
    { label: 'Average Loser', value: fmtCurrency(metrics.avgLoser, currency), isPos: false, icon: TrendingDown },
    { label: 'Largest Winner', value: fmtCurrency(metrics.largestWinner, currency), isPos: true, icon: Award },
    { label: 'Largest Loser', value: fmtCurrency(metrics.largestLoser, currency), isPos: false, icon: TrendingDown },
    { label: 'Average Risk:Reward', value: metrics.avgRiskReward > 0 ? `1 : ${metrics.avgRiskReward.toFixed(2)}` : 'N/A', isPos: metrics.avgRiskReward >= 1.5, icon: Shield },
    { label: 'Expectancy / Trade', value: fmtCurrency(metrics.expectancy, currency), isPos: metrics.expectancy >= 0, icon: DollarSign },
    { label: 'Avg Holding Time', value: formatHoldingTime(metrics.avgHoldingTimeMins), isPos: true, icon: Clock },
    { label: 'Current Drawdown', value: fmtPct(metrics.currentDrawdownPct, 1), isPos: metrics.currentDrawdownPct < 5, icon: Shield },
    { label: 'Max Drawdown', value: fmtPct(metrics.maxDrawdownPct, 1), isPos: metrics.maxDrawdownPct < 10, icon: Shield }
  ];

  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime())
    .slice(0, 6);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Terminal Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time automated performance computation & equity curve tracker
          </p>
        </div>
        <button
          onClick={handleNewTradeClick}
          className="px-4 py-2.5 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-xs flex items-center gap-2 transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Log Trade
        </button>
      </div>

      {/* KPI Cards Grid (~25 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {kpiList.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-[#12161E] border border-gray-800/90 hover:border-gray-700/80 p-3.5 rounded-2xl transition shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-gray-400 mb-2">
                <span className="text-[11px] font-medium truncate">{kpi.label}</span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${kpi.isPos ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`} />
              </div>
              <div className={`font-mono font-bold text-sm sm:text-base tracking-tight ${kpi.isPos ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Equity Curve Area Chart */}
      <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-base text-white">Cumulative Equity Curve</h3>
            <p className="text-xs text-gray-400">Account equity progression starting from {fmtCurrency(safeSettings.initialCapital ?? 100000, currency)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Current Equity</span>
            <span className="font-mono font-bold text-lg text-[#3ED9B8]">
              {fmtCurrency(metrics.currentEquity, currency)}
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.equityCurve}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3ED9B8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3ED9B8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2633" />
              <XAxis dataKey="date" stroke="#6B7280" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={val => `${val / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12161E',
                  borderColor: '#2A3447',
                  borderRadius: '12px',
                  color: '#FFFFFF'
                }}
                labelStyle={{ color: '#3ED9B8', fontWeight: 'bold' }}
                itemStyle={{ color: '#FFFFFF' }}
                formatter={(val: any) => [fmtCurrency(Number(val), currency), 'Account Equity']}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#3ED9B8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#equityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Trades Table Section */}
      <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-base text-white">Recent Executed Positions</h3>
          <span className="text-xs text-gray-400">Showing last 6 trades</span>
        </div>

        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">No recorded trades yet. Click "Log Trade" above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-medium">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Stock Symbol</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Entry</th>
                  <th className="py-2.5 px-3 text-right">Exit</th>
                  <th className="py-2.5 px-3 text-right">Net P&L</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {recentTrades.map(trade => {
                  const grossPnl = trade.status === 'Closed' ? (trade.exitPrice! - trade.entryPrice) * trade.quantity * (trade.direction === 'Long' ? 1 : -1) : 0;
                  const totalChg = (trade.charges?.brokerage || 0) + (trade.charges?.stt || 0);
                  const netPnl = grossPnl - totalChg;

                  return (
                    <tr
                      key={trade.id}
                      onClick={() => onEditTrade(trade)}
                      className="hover:bg-[#191F2A] cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-mono text-gray-300">{trade.tradeDate}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{trade.stockName}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          trade.direction === 'Long' ? 'bg-[#3ED9B8]/20 text-[#3ED9B8]' : 'bg-[#E28B5C]/20 text-[#E28B5C]'
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-400">{trade.tradeType}</td>
                      <td className="py-3 px-3 text-right font-mono text-gray-300">{fmtCurrency(trade.entryPrice, currency)}</td>
                      <td className="py-3 px-3 text-right font-mono text-gray-300">{trade.exitPrice ? fmtCurrency(trade.exitPrice, currency) : '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {trade.status === 'Closed' ? (
                          <span className={netPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}>
                            {fmtCurrency(netPnl, currency)}
                          </span>
                        ) : (
                          <span className="text-blue-400">Open</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          trade.status === 'Closed' ? 'bg-gray-800 text-gray-300' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
