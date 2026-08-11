import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { Trade, UserSettings } from '../types';
import { calculateTradeMetrics, fmtCurrency, fmtPct } from '../lib/calculations';
import { generateExcelReport } from '../lib/excelExport';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface TradesPageProps {
  trades?: Trade[];
  settings?: UserSettings;
  onNewTrade?: () => void;
  onOpenNewTrade?: () => void;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onCloneTrade?: (trade: Trade) => void;
}

export const TradesPage: React.FC<TradesPageProps> = ({
  trades = [],
  settings,
  onNewTrade,
  onOpenNewTrade,
  onEditTrade,
  onDeleteTrade,
  onCloneTrade
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';
  const handleNew = onNewTrade || onOpenNewTrade || (() => {});

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [directionFilter, setDirectionFilter] = useState<string>('All');
  const [segmentFilter, setSegmentFilter] = useState<string>('All');
  const [strategyFilter, setStrategyFilter] = useState<string>('All');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('All'); // All, Win, Loss
  const [sortField, setSortField] = useState<keyof Trade>('tradeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Filtered and Sorted Trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const metrics = calculateTradeMetrics(trade);

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchStock = trade.stockName.toLowerCase().includes(q);
        const matchStrat = trade.strategy.toLowerCase().includes(q);
        const matchNotes = trade.notes ? trade.notes.toLowerCase().includes(q) : false;
        const matchId = trade.id.toLowerCase().includes(q);
        if (!matchStock && !matchStrat && !matchNotes && !matchId) return false;
      }

      // Status
      if (statusFilter !== 'All' && trade.status !== statusFilter) return false;

      // Direction
      if (directionFilter !== 'All' && trade.direction !== directionFilter) return false;

      // Segment
      if (segmentFilter !== 'All' && trade.segment !== segmentFilter) return false;

      // Strategy
      if (strategyFilter !== 'All' && trade.strategy !== strategyFilter) return false;

      // Outcome
      if (outcomeFilter === 'Win' && metrics.netPnl <= 0) return false;
      if (outcomeFilter === 'Loss' && metrics.netPnl >= 0) return false;

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'tradeDate') {
        valA = new Date(a.tradeDate).getTime();
        valB = new Date(b.tradeDate).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [trades, searchTerm, statusFilter, directionFilter, segmentFilter, strategyFilter, outcomeFilter, sortField, sortOrder]);

  // Page level summary metrics
  const summary = useMemo(() => {
    let totalPnl = 0;
    let totalCharges = 0;
    let wins = 0;
    let losses = 0;

    filteredTrades.forEach(t => {
      if (t.status === 'Closed') {
        const m = calculateTradeMetrics(t);
        totalPnl += m.netPnl;
        totalCharges += m.totalCharges;
        if (m.netPnl > 0) wins++;
        else if (m.netPnl < 0) losses++;
      }
    });

    const totalClosed = wins + losses;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    return { totalPnl, totalCharges, wins, losses, winRate, count: filteredTrades.length };
  }, [filteredTrades]);

  const handleSort = (field: keyof Trade) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportExcel = () => {
    generateExcelReport(filteredTrades, safeSettings, '', '');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Trades Journal Log
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Complete record of executions, transaction charges, and psychological notes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-[#191F2A] hover:bg-[#222a38] text-gray-200 hover:text-white font-medium text-xs border border-gray-800 flex items-center gap-2 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#3ED9B8]" />
            Export Excel
          </button>
          <button
            onClick={handleNew}
            className="px-4 py-2 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-xs flex items-center gap-2 transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Trade
          </button>
        </div>
      </div>

      {/* Summary Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#12161E] border border-gray-800 p-4 rounded-2xl text-xs">
        <div>
          <span className="text-gray-400 block mb-0.5">Filter Match Count</span>
          <span className="font-mono font-bold text-white text-sm">{summary.count} Trades</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Filter Net P&L</span>
          <span className={`font-mono font-bold text-sm ${summary.totalPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
            {fmtCurrency(summary.totalPnl, currency)}
          </span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Total Charges</span>
          <span className="font-mono font-medium text-gray-300 text-sm">{fmtCurrency(summary.totalCharges, currency)}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Win / Loss Ratio</span>
          <span className="font-mono font-medium text-white text-sm">{summary.wins}W - {summary.losses}L</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">Win Rate</span>
          <span className={`font-mono font-bold text-sm ${summary.winRate >= 50 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
            {fmtPct(summary.winRate, 1)}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#12161E] border border-gray-800/90 p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search symbol, notes, strategy, ID..."
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-[#3ED9B8] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Closed">Closed</option>
              <option value="Open">Open</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Direction Filter */}
          <div>
            <select
              value={directionFilter}
              onChange={e => setDirectionFilter(e.target.value)}
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
            >
              <option value="All">Direction: All</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>

          {/* Segment Filter */}
          <div>
            <select
              value={segmentFilter}
              onChange={e => setSegmentFilter(e.target.value)}
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
            >
              <option value="All">Segment: All</option>
              <option value="Equity">Equity</option>
              <option value="F&O">F&O</option>
              <option value="Options">Options</option>
              <option value="Futures">Futures</option>
              <option value="Currency">Currency</option>
              <option value="Commodity">Commodity</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <select
              value={outcomeFilter}
              onChange={e => setOutcomeFilter(e.target.value)}
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-2.5 py-2 text-xs text-gray-300 focus:border-[#3ED9B8] focus:outline-none"
            >
              <option value="All">Outcome: All</option>
              <option value="Win">Winners Only</option>
              <option value="Loss">Losers Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trades Main Table */}
      <div className="bg-[#12161E] border border-gray-800/90 rounded-2xl shadow-sm overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No trades match your search criteria. Try resetting filters or log a new trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-gray-800">
              <thead className="bg-[#161B24] text-gray-400 font-medium select-none">
                <tr>
                  <th className="py-3 px-3 w-8"></th>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => handleSort('tradeDate')}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer" onClick={() => handleSort('stockName')}>
                    <div className="flex items-center gap-1">
                      Stock / Instrument
                      <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Direction</th>
                  <th className="py-3 px-3">Segment</th>
                  <th className="py-3 px-3">Strategy</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Entry</th>
                  <th className="py-3 px-3 text-right">Exit</th>
                  <th className="py-3 px-3 text-right">Charges</th>
                  <th className="py-3 px-3 text-right">Net P&L</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredTrades.map(trade => {
                  const isExpanded = expandedTradeId === trade.id;
                  const metrics = calculateTradeMetrics(trade);

                  return (
                    <React.Fragment key={trade.id}>
                      <tr className="hover:bg-[#191F2A] transition">
                        <td className="py-3 px-3">
                          <button
                            onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                            className="p-1 rounded text-gray-500 hover:text-white"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-300">{trade.tradeDate}</td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-white flex items-center gap-2">
                            <span>{trade.stockName}</span>
                            {trade.segment === 'Options' && trade.optionsIndex && (
                              <span className="text-[10px] text-[#3ED9B8] bg-[#3ED9B8]/10 px-1.5 py-0.2 rounded font-sans">
                                {trade.optionsIndex} {trade.strikePrice} {trade.optionType}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{trade.sector}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            trade.direction === 'Long' ? 'bg-[#3ED9B8]/20 text-[#3ED9B8]' : 'bg-[#E28B5C]/20 text-[#E28B5C]'
                          }`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400">{trade.segment}</td>
                        <td className="py-3 px-3 text-gray-300 font-medium">{trade.strategy}</td>
                        <td className="py-3 px-3 text-right font-mono text-gray-300">{trade.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono text-gray-300">{fmtCurrency(trade.entryPrice, currency)}</td>
                        <td className="py-3 px-3 text-right font-mono text-gray-300">{trade.exitPrice ? fmtCurrency(trade.exitPrice, currency) : '-'}</td>
                        <td className="py-3 px-3 text-right font-mono text-gray-400">{fmtCurrency(metrics.totalCharges, currency)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {trade.status === 'Closed' ? (
                            <span className={metrics.netPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}>
                              {fmtCurrency(metrics.netPnl, currency)}
                            </span>
                          ) : (
                            <span className="text-blue-400 font-normal">Open</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            trade.status === 'Closed' ? 'bg-gray-800 text-gray-300' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onEditTrade(trade)}
                              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
                              title="Edit Trade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onCloneTrade(trade)}
                              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
                              title="Clone Trade"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteTrade(trade.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition"
                              title="Delete Trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Drawer Details */}
                      {isExpanded && (
                        <tr className="bg-[#161B24]/70">
                          <td colSpan={13} className="p-4 border-t border-b border-gray-800/80">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              {/* Column 1: Financial & Risk Breakdown */}
                              <div className="space-y-1.5 bg-[#12161E] p-3 rounded-xl border border-gray-800">
                                <h4 className="font-semibold text-[#3ED9B8] mb-2 uppercase tracking-wider text-[11px]">
                                  Financial & Risk Metrics
                                </h4>
                                <div className="flex justify-between text-gray-400">
                                  <span>Gross P&L:</span>
                                  <span className="font-mono text-white">{fmtCurrency(metrics.grossPnl, currency)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Brokerage & Charges:</span>
                                  <span className="font-mono text-gray-300">{fmtCurrency(metrics.totalCharges, currency)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>ROI %:</span>
                                  <span className="font-mono text-white">{fmtPct(metrics.roiPct)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Risk Amount (SL):</span>
                                  <span className="font-mono text-[#E28B5C]">{fmtCurrency(metrics.riskAmount, currency)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Reward Amount (Tgt):</span>
                                  <span className="font-mono text-[#3ED9B8]">{fmtCurrency(metrics.rewardAmount, currency)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Risk:Reward Ratio:</span>
                                  <span className="font-mono text-[#D9B968]">
                                    {metrics.riskRewardRatio > 0 ? `1 : ${metrics.riskRewardRatio.toFixed(2)}` : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* Column 2: Psychological State & Mistakes */}
                              <div className="space-y-1.5 bg-[#12161E] p-3 rounded-xl border border-gray-800">
                                <h4 className="font-semibold text-[#3ED9B8] mb-2 uppercase tracking-wider text-[11px]">
                                  Psychology & Compliance
                                </h4>
                                <div className="flex justify-between text-gray-400">
                                  <span>Emotion Before Entry:</span>
                                  <span className="font-medium text-white">{trade.emotionBefore || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Emotion After Exit:</span>
                                  <span className="font-medium text-white">{trade.emotionAfter || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Mistake Category:</span>
                                  <span className={`font-semibold ${trade.mistakeCategory && trade.mistakeCategory !== 'None' ? 'text-[#E28B5C]' : 'text-[#3ED9B8]'}`}>
                                    {trade.mistakeCategory || 'None'}
                                  </span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Income Category:</span>
                                  <span className="text-gray-300">{trade.incomeCategory}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                  <span>Trade Timing:</span>
                                  <span className="font-mono text-gray-300">{trade.entryTime || '09:30'} - {trade.exitTime || '15:15'}</span>
                                </div>
                              </div>

                              {/* Column 3: Notes & TradingView Link */}
                              <div className="space-y-2 bg-[#12161E] p-3 rounded-xl border border-gray-800 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-semibold text-[#3ED9B8] mb-1 uppercase tracking-wider text-[11px]">
                                    Journal Rationale Notes
                                  </h4>
                                  <p className="text-gray-300 text-xs leading-relaxed italic">
                                    {trade.notes || 'No detailed notes logged for this position.'}
                                  </p>
                                </div>

                                {trade.tradingViewUrl && (
                                  <a
                                    href={trade.tradingViewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#3ED9B8] hover:underline"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Open TradingView Chart Screenshot
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
