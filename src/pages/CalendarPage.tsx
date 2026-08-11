import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { Trade, UserSettings } from '../types';
import { calculateTradeMetrics, fmtCurrency, fmtPct } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface CalendarPageProps {
  trades?: Trade[];
  settings?: UserSettings;
  onEditTrade?: (trade: Trade) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  trades = [],
  settings,
  onEditTrade
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';

  // State for selected Year and Month
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group trades by date (YYYY-MM-DD)
  const tradesByDate = useMemo(() => {
    const map: Record<string, { trades: Trade[]; netPnl: number; wins: number; losses: number }> = {};

    trades.forEach(t => {
      if (!t.tradeDate) return;
      if (!map[t.tradeDate]) {
        map[t.tradeDate] = { trades: [], netPnl: 0, wins: 0, losses: 0 };
      }

      map[t.tradeDate].trades.push(t);

      if (t.status === 'Closed') {
        const m = calculateTradeMetrics(t);
        map[t.tradeDate].netPnl += m.netPnl;
        if (m.netPnl > 0) map[t.tradeDate].wins++;
        else if (m.netPnl < 0) map[t.tradeDate].losses++;
      }
    });

    return map;
  }, [trades]);

  // Compute Days Grid for Month
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: ({ dateStr: string; dayNum: number; isCurrentMonth: boolean } | null)[] = [];

    // Empty padding days before month start
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Actual days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthFormatted = String(month + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true
      });
    }

    return days;
  }, [year, month]);

  // Monthly aggregated totals
  const monthlyTotals = useMemo(() => {
    let monthPnl = 0;
    let totalTradesCount = 0;
    let greenDays = 0;
    let redDays = 0;

    Object.entries(tradesByDate).forEach(([dateStr, data]) => {
      const dayData = data as { trades: Trade[]; netPnl: number; wins: number; losses: number };
      const dObj = new Date(dateStr);
      if (dObj.getFullYear() === year && dObj.getMonth() === month) {
        monthPnl += dayData.netPnl;
        totalTradesCount += dayData.trades.length;
        if (dayData.netPnl > 0) greenDays++;
        else if (dayData.netPnl < 0) redDays++;
      }
    });

    return { monthPnl, totalTradesCount, greenDays, redDays };
  }, [tradesByDate, year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayStr(null);
  };

  const selectedDayTrades = selectedDayStr ? (tradesByDate[selectedDayStr]?.trades || []) : [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            P&L Calendar Tracker
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Visual daily & monthly profit/loss distribution matrix
          </p>
        </div>

        {/* Month Switcher Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-[#191F2A] hover:bg-[#222a38] text-gray-300 border border-gray-800 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-base text-white w-40 text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-[#191F2A] hover:bg-[#222a38] text-gray-300 border border-gray-800 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Monthly Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#12161E] border border-gray-800 p-4 rounded-2xl">
        <div>
          <span className="text-xs text-gray-400 block mb-1">Monthly Net P&L</span>
          <span className={`font-mono font-extrabold text-lg ${monthlyTotals.monthPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
            {fmtCurrency(monthlyTotals.monthPnl, currency)}
          </span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-1">Total Month Executions</span>
          <span className="font-mono font-bold text-base text-white">{monthlyTotals.totalTradesCount} Trades</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-1">Green Trading Days</span>
          <span className="font-mono font-bold text-base text-[#3ED9B8]">{monthlyTotals.greenDays} Days</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-1">Red Trading Days</span>
          <span className="font-mono font-bold text-base text-[#E28B5C]">{monthlyTotals.redDays} Days</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#12161E] border border-gray-800/90 rounded-2xl p-4 shadow-sm">
        {/* Days of Week Row */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-gray-400 mb-2">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarGrid.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty_${idx}`}
                  className="h-20 sm:h-28 bg-[#0B0E13]/40 border border-gray-900/60 rounded-xl"
                />
              );
            }

            const dayData = tradesByDate[day.dateStr];
            const hasTrades = !!dayData && dayData.trades.length > 0;
            const netPnl = dayData?.netPnl || 0;
            const isGreen = netPnl > 0;
            const isRed = netPnl < 0;
            const isSelected = selectedDayStr === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDayStr(day.dateStr)}
                className={`h-20 sm:h-28 p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#3ED9B8] ring-2 ring-[#3ED9B8]/30 bg-[#191F2A]'
                    : isGreen
                    ? 'bg-[#3ED9B8]/10 border-[#3ED9B8]/30 hover:border-[#3ED9B8]'
                    : isRed
                    ? 'bg-[#E28B5C]/10 border-[#E28B5C]/30 hover:border-[#E28B5C]'
                    : 'bg-[#161B24] border-gray-800/80 hover:bg-[#191F2A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-gray-300">{day.dayNum}</span>
                  {hasTrades && (
                    <span className="text-[10px] bg-gray-800 text-gray-300 font-mono px-1.5 py-0.2 rounded">
                      {dayData.trades.length}t
                    </span>
                  )}
                </div>

                {hasTrades ? (
                  <div className="space-y-0.5">
                    <div className={`font-mono font-bold text-xs sm:text-sm tracking-tight ${isGreen ? 'text-[#3ED9B8]' : isRed ? 'text-[#E28B5C]' : 'text-gray-400'}`}>
                      {fmtCurrency(netPnl, currency, 0)}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono hidden sm:block">
                      {dayData.wins}W / {dayData.losses}L
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 block italic">No trades</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Trade Details Drawer Panel */}
      {selectedDayStr && (
        <div className="bg-[#12161E] border border-gray-800 p-5 rounded-2xl shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-base text-white">
                Trades Executed on {selectedDayStr}
              </h3>
              <p className="text-xs text-gray-400">
                {selectedDayTrades.length} trade(s) logged on this date
              </p>
            </div>
            <button
              onClick={() => setSelectedDayStr(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>

          {selectedDayTrades.length === 0 ? (
            <div className="text-xs text-gray-500 py-4">No trades recorded on this date.</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {selectedDayTrades.map(trade => {
                const metrics = calculateTradeMetrics(trade);

                return (
                  <div
                    key={trade.id}
                    onClick={() => onEditTrade(trade)}
                    className="py-3 flex items-center justify-between hover:bg-[#191F2A] px-3 rounded-xl transition cursor-pointer text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-white flex items-center gap-2">
                        <span>{trade.stockName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                          trade.direction === 'Long' ? 'bg-[#3ED9B8]/20 text-[#3ED9B8]' : 'bg-[#E28B5C]/20 text-[#E28B5C]'
                        }`}>
                          {trade.direction}
                        </span>
                        <span className="text-gray-400 text-[11px] font-sans">({trade.strategy})</span>
                      </div>
                      <div className="text-gray-400 mt-1">
                        Entry: <span className="font-mono text-gray-200">{fmtCurrency(trade.entryPrice, currency)}</span> •
                        Exit: <span className="font-mono text-gray-200">{trade.exitPrice ? fmtCurrency(trade.exitPrice, currency) : '-'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${metrics.netPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
                        {fmtCurrency(metrics.netPnl, currency)}
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Charges: {fmtCurrency(metrics.totalCharges, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
