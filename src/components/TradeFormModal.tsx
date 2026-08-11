import React, { useState, useEffect, useMemo } from 'react';
import { X, Calculator, Search, ExternalLink, AlertCircle, Save } from 'lucide-react';
import { Trade, TradeSegment, TradeDirection, TradeType, IncomeCategory, StrategyType, OptionsIndex, OptionType, Emotion, MistakeCategory, TradeStatus, UserSettings } from '../types';
import { NIFTY_500_STOCKS, NSE_SECTORS } from '../data/nifty500';
import { calculateTradeMetrics, fmtCurrency, fmtPct, formatHoldingTime } from '../lib/calculations';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface TradeFormModalProps {
  isOpen: boolean;
  initialTrade?: Partial<Trade> | null;
  trade?: Partial<Trade> | null;
  settings?: UserSettings;
  onClose: () => void;
  onSave: (trade: Trade) => void;
}

export const TradeFormModal: React.FC<TradeFormModalProps> = ({
  isOpen,
  initialTrade,
  trade,
  settings,
  onClose,
  onSave
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const currency = safeSettings.currency || 'INR';

  const [stockSearch, setStockSearch] = useState('');
  const [showStockDropdown, setShowStockDropdown] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Trade>>({
    id: `trd_${Date.now()}`,
    tradeDate: new Date().toISOString().split('T')[0],
    stockName: 'RELIANCE',
    sector: 'Energy & Oil & Gas',
    exchange: 'NSE',
    segment: 'Equity',
    direction: 'Long',
    tradeType: 'Swing',
    incomeCategory: 'Weekly',
    strategy: 'Supply/Demand Zone',
    entryPrice: 0,
    exitPrice: 0,
    quantity: 1,
    capitalUsed: 0,
    leverage: 1,
    stopLoss: 0,
    target: 0,
    charges: { ...safeSettings.defaultCharges },
    entryTime: '09:30',
    exitTime: '15:15',
    status: 'Closed',
    emotionBefore: 'Calm',
    emotionAfter: 'Confident',
    mistakeCategory: 'None',
    notes: '',
    tradingViewUrl: ''
  });

  useEffect(() => {
    if (isOpen) {
      const activeTrade = initialTrade || trade;
      if (activeTrade && activeTrade.id) {
        setFormData({
          ...activeTrade,
          charges: activeTrade.charges || { ...safeSettings.defaultCharges }
        });
        setStockSearch(activeTrade.stockName || '');
      } else {
        const autoId = `trd_${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData({
          id: autoId,
          tradeDate: new Date().toISOString().split('T')[0],
          stockName: activeTrade?.stockName || 'RELIANCE',
          sector: activeTrade?.sector || 'Energy & Oil & Gas',
          exchange: 'NSE',
          segment: 'Equity',
          direction: 'Long',
          tradeType: 'Swing',
          incomeCategory: 'Weekly',
          strategy: 'Supply/Demand Zone',
          entryPrice: activeTrade?.entryPrice || 1000,
          exitPrice: 1050,
          quantity: 100,
          capitalUsed: (activeTrade?.entryPrice || 1000) * 100,
          leverage: 1,
          stopLoss: 980,
          target: 1080,
          charges: { ...safeSettings.defaultCharges },
          entryTime: '09:30',
          exitTime: '15:15',
          status: 'Closed',
          emotionBefore: 'Calm',
          emotionAfter: 'Confident',
          mistakeCategory: 'None',
          notes: '',
          tradingViewUrl: ''
        });
        setStockSearch(activeTrade?.stockName || 'RELIANCE');
      }
    }
  }, [isOpen, initialTrade, trade, safeSettings]);

  // Live Calculations
  const liveMetrics = useMemo(() => {
    return calculateTradeMetrics(formData);
  }, [formData]);

  // Filtered Stock List for Combobox
  const filteredStocks = useMemo(() => {
    if (!stockSearch.trim()) return NIFTY_500_STOCKS.slice(0, 8);
    const query = stockSearch.toLowerCase();
    return NIFTY_500_STOCKS.filter(
      s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [stockSearch]);

  if (!isOpen) return null;

  const handleStockSelect = (symbol: string, sector: string) => {
    setStockSearch(symbol);
    setFormData(prev => ({
      ...prev,
      stockName: symbol,
      sector
    }));
    setShowStockDropdown(false);
  };

  const handlePriceOrQtyChange = (entryP: number, qty: number) => {
    setFormData(prev => ({
      ...prev,
      entryPrice: entryP,
      quantity: qty,
      capitalUsed: prev.capitalUsed && prev.capitalUsed > 0 ? prev.capitalUsed : entryP * qty
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stockName) return;

    const finalTrade: Trade = {
      ...(formData as Trade),
      id: formData.id || `trd_${Date.now()}`,
      userId: formData.userId || 'user',
      entryPrice: Number(formData.entryPrice) || 0,
      exitPrice: formData.status === 'Closed' ? Number(formData.exitPrice) || 0 : undefined,
      quantity: Number(formData.quantity) || 1,
      capitalUsed: Number(formData.capitalUsed) || (Number(formData.entryPrice) * Number(formData.quantity)),
      leverage: Number(formData.leverage) || 1,
      stopLoss: Number(formData.stopLoss) || 0,
      target: Number(formData.target) || 0,
      createdAt: formData.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(finalTrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#12161E] text-white border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#161B24]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#191F2A] border border-gray-800 text-[#3ED9B8]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-gray-100">
                {initialTrade?.id ? 'Edit Trade Details' : 'Record New Trade'}
              </h2>
              <p className="text-xs text-gray-400">Trade ID: <span className="font-mono text-[#3ED9B8]">{formData.id}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Calculation Panel */}
          <div className="bg-[#191F2A] border border-gray-800 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block mb-1">Gross P&L</span>
              <span className={`font-mono font-semibold text-sm ${liveMetrics.grossPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
                {fmtCurrency(liveMetrics.grossPnl, currency)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Total Charges</span>
              <span className="font-mono font-semibold text-sm text-gray-300">
                {fmtCurrency(liveMetrics.totalCharges, currency)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Net P&L</span>
              <span className={`font-mono font-bold text-base ${liveMetrics.netPnl >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
                {fmtCurrency(liveMetrics.netPnl, currency)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">ROI %</span>
              <span className={`font-mono font-semibold text-sm ${liveMetrics.roiPct >= 0 ? 'text-[#3ED9B8]' : 'text-[#E28B5C]'}`}>
                {fmtPct(liveMetrics.roiPct)}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Risk : Reward</span>
              <span className="font-mono font-semibold text-sm text-[#D9B968]">
                {liveMetrics.riskRewardRatio > 0 ? `1 : ${liveMetrics.riskRewardRatio.toFixed(2)}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Holding Time</span>
              <span className="font-mono font-semibold text-sm text-blue-400">
                {formatHoldingTime(liveMetrics.holdingTimeMins)}
              </span>
            </div>
          </div>

          {/* SECTION 1: EXECUTION */}
          <div>
            <h3 className="text-sm font-semibold text-[#3ED9B8] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ED9B8]" />
              Execution Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Trade Date</label>
                <input
                  type="date"
                  value={formData.tradeDate}
                  onChange={e => setFormData({ ...formData, tradeDate: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                  required
                />
              </div>

              {/* Stock Combobox */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Stock Name (Nifty 500 Combobox)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={e => {
                      setStockSearch(e.target.value);
                      setFormData({ ...formData, stockName: e.target.value });
                      setShowStockDropdown(true);
                    }}
                    onFocus={() => setShowStockDropdown(true)}
                    placeholder="Search Nifty 500 symbol..."
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-white uppercase font-mono focus:border-[#3ED9B8] focus:outline-none"
                    required
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                </div>

                {showStockDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-[#191F2A] border border-gray-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-gray-800/50">
                    {filteredStocks.map(stock => (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => handleStockSelect(stock.symbol, stock.sector)}
                        className="w-full text-left px-3 py-2 hover:bg-[#222a38] transition flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#3ED9B8]">{stock.symbol}</span>
                          <span className="text-gray-400 ml-2 text-[11px]">{stock.name}</span>
                        </div>
                        <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">
                          {stock.sector}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Sector Classification</label>
                <select
                  value={formData.sector}
                  onChange={e => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  {NSE_SECTORS.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              {/* Exchange & Segment */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Exchange</label>
                <select
                  value={formData.exchange}
                  onChange={e => setFormData({ ...formData, exchange: e.target.value as any })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="NSE">NSE (India)</option>
                  <option value="BSE">BSE (India)</option>
                  <option value="NASDAQ">NASDAQ</option>
                  <option value="NYSE">NYSE</option>
                  <option value="LSE">LSE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Segment</label>
                <select
                  value={formData.segment}
                  onChange={e => setFormData({ ...formData, segment: e.target.value as TradeSegment })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="Equity">Equity (Delivery/Intraday)</option>
                  <option value="F&O">F&O Futures</option>
                  <option value="Options">Options Contract</option>
                  <option value="Futures">Futures</option>
                  <option value="Currency">Currency</option>
                  <option value="Commodity">Commodity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Direction</label>
                <select
                  value={formData.direction}
                  onChange={e => setFormData({ ...formData, direction: e.target.value as TradeDirection })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none font-semibold"
                >
                  <option value="Long" className="text-[#3ED9B8]">Long (BUY)</option>
                  <option value="Short" className="text-[#E28B5C]">Short (SELL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Trade Type</label>
                <select
                  value={formData.tradeType}
                  onChange={e => setFormData({ ...formData, tradeType: e.target.value as TradeType })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="Intraday">Intraday</option>
                  <option value="Swing">Swing</option>
                  <option value="Positional">Positional</option>
                  <option value="Scalp">Scalp</option>
                  <option value="Options">Options</option>
                  <option value="Futures">Futures</option>
                  <option value="Investment">Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Income Category</label>
                <select
                  value={formData.incomeCategory}
                  onChange={e => setFormData({ ...formData, incomeCategory: e.target.value as IncomeCategory })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half Yearly">Half Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Strategy</label>
                <select
                  value={formData.strategy}
                  onChange={e => setFormData({ ...formData, strategy: e.target.value as StrategyType })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="Supply/Demand Zone">Supply/Demand Zone</option>
                  <option value="EMA Stack 9/21/50">EMA Stack 9/21/50</option>
                  <option value="Breakout">Breakout</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Trend Following">Trend Following</option>
                  <option value="Mean Reversion">Mean Reversion</option>
                  <option value="News Play">News Play</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: CONDITIONAL OPTIONS CONTRACT */}
          {formData.segment === 'Options' && (
            <div className="bg-[#191F2A]/60 border border-[#3ED9B8]/30 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#3ED9B8] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3ED9B8]" />
                Options Contract Specification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Index / Underlying</label>
                  <select
                    value={formData.optionsIndex || 'NIFTY 50'}
                    onChange={e => setFormData({ ...formData, optionsIndex: e.target.value as OptionsIndex })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                  >
                    <option value="NIFTY 50">NIFTY 50</option>
                    <option value="BANK NIFTY">BANK NIFTY</option>
                    <option value="FIN NIFTY">FIN NIFTY</option>
                    <option value="MIDCAP NIFTY">MIDCAP NIFTY</option>
                    <option value="SENSEX">SENSEX</option>
                    <option value="BANKEX">BANKEX</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Strike Price</label>
                  <input
                    type="number"
                    value={formData.strikePrice || ''}
                    onChange={e => setFormData({ ...formData, strikePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 24500"
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Option Type</label>
                  <select
                    value={formData.optionType || 'CE'}
                    onChange={e => setFormData({ ...formData, optionType: e.target.value as OptionType })}
                    className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-[#3ED9B8] focus:outline-none"
                  >
                    <option value="CE">CE (Call Option)</option>
                    <option value="PE">PE (Put Option)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: NUMERIC PRICES & QUANTITY */}
          <div>
            <h3 className="text-sm font-semibold text-[#3ED9B8] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ED9B8]" />
              Pricing & Capital
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Entry Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.entryPrice || ''}
                  onChange={e => {
                    const ep = parseFloat(e.target.value) || 0;
                    handlePriceOrQtyChange(ep, formData.quantity || 1);
                  }}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Exit Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.exitPrice || ''}
                  onChange={e => setFormData({ ...formData, exitPrice: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.status === 'Open' ? 'Open Position' : 'e.g. 1050'}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                  disabled={formData.status === 'Open'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Quantity / Lots</label>
                <input
                  type="number"
                  value={formData.quantity || ''}
                  onChange={e => {
                    const q = parseFloat(e.target.value) || 1;
                    handlePriceOrQtyChange(formData.entryPrice || 0, q);
                  }}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Capital Used ({currency})</label>
                <input
                  type="number"
                  value={formData.capitalUsed || ''}
                  onChange={e => setFormData({ ...formData, capitalUsed: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Stop Loss ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.stopLoss || ''}
                  onChange={e => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-[#E28B5C] focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Target Price ({currency})</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.target || ''}
                  onChange={e => setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-[#3ED9B8] focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Entry Time</label>
                <input
                  type="time"
                  value={formData.entryTime || ''}
                  onChange={e => setFormData({ ...formData, entryTime: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Exit Time</label>
                <input
                  type="time"
                  value={formData.exitTime || ''}
                  onChange={e => setFormData({ ...formData, exitTime: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono focus:border-[#3ED9B8] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: CHARGES BREAKDOWN */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#3ED9B8] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3ED9B8]" />
                Brokerage & Transaction Charges ({currency})
              </h3>
              <span className="text-xs text-gray-400">Total: <strong className="text-white font-mono">{fmtCurrency(liveMetrics.totalCharges, currency)}</strong></span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Brokerage</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.brokerage ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, brokerage: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Exchange</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.exchangeCharges ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, exchangeCharges: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">GST</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.gst ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, gst: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">STT</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.stt ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, stt: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">SEBI</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.sebiCharges ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, sebiCharges: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Stamp Duty</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.stampDuty ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, stampDuty: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Other</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.charges?.otherCharges ?? 0}
                  onChange={e => setFormData({
                    ...formData,
                    charges: { ...formData.charges!, otherCharges: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-lg p-1.5 font-mono text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: PSYCHOLOGY & NOTES */}
          <div>
            <h3 className="text-sm font-semibold text-[#3ED9B8] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ED9B8]" />
              Psychology, Mistakes & Journal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Emotion Before Trade</label>
                <select
                  value={formData.emotionBefore || 'Calm'}
                  onChange={e => setFormData({ ...formData, emotionBefore: e.target.value as Emotion })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="Calm">Calm</option>
                  <option value="Confident">Confident</option>
                  <option value="Anxious">Anxious</option>
                  <option value="Greedy">Greedy</option>
                  <option value="Fearful">Fearful</option>
                  <option value="Frustrated">Frustrated</option>
                  <option value="Excited">Excited</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Emotion After Trade</label>
                <select
                  value={formData.emotionAfter || 'Confident'}
                  onChange={e => setFormData({ ...formData, emotionAfter: e.target.value as Emotion })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="Calm">Calm</option>
                  <option value="Confident">Confident</option>
                  <option value="Anxious">Anxious</option>
                  <option value="Greedy">Greedy</option>
                  <option value="Fearful">Fearful</option>
                  <option value="Frustrated">Frustrated</option>
                  <option value="Excited">Excited</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Mistake Category</label>
                <select
                  value={formData.mistakeCategory || 'None'}
                  onChange={e => setFormData({ ...formData, mistakeCategory: e.target.value as MistakeCategory })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-[#3ED9B8] focus:outline-none"
                >
                  <option value="None">None (Followed Plan)</option>
                  <option value="FOMO Entry">FOMO Entry</option>
                  <option value="Late Entry">Late Entry</option>
                  <option value="Early Exit">Early Exit</option>
                  <option value="No Stop Loss">No Stop Loss</option>
                  <option value="Overleveraged">Overleveraged</option>
                  <option value="Revenge Trade">Revenge Trade</option>
                  <option value="Ignored Plan">Ignored Plan</option>
                  <option value="Chasing Price">Chasing Price</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Trade Journal Notes (Surfaces automatically on Notes page)
                </label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Record execution details, market context, technical observations..."
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-3 text-white focus:border-[#3ED9B8] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">TradingView Chart Link URL</label>
                <input
                  type="url"
                  value={formData.tradingViewUrl || ''}
                  onChange={e => setFormData({ ...formData, tradingViewUrl: e.target.value })}
                  placeholder="https://www.tradingview.com/chart/..."
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white text-xs focus:border-[#3ED9B8] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Trade Status Pill */}
          <div className="flex items-center gap-4 bg-[#161B24] p-3 rounded-xl border border-gray-800">
            <span className="text-xs font-medium text-gray-300">Position Status:</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="Closed"
                  checked={formData.status === 'Closed'}
                  onChange={() => setFormData({ ...formData, status: 'Closed' })}
                  className="accent-[#3ED9B8]"
                />
                <span className="text-white font-medium">Closed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="Open"
                  checked={formData.status === 'Open'}
                  onChange={() => setFormData({ ...formData, status: 'Open' })}
                  className="accent-blue-400"
                />
                <span className="text-blue-400 font-medium">Open Position</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="Cancelled"
                  checked={formData.status === 'Cancelled'}
                  onChange={() => setFormData({ ...formData, status: 'Cancelled' })}
                  className="accent-gray-500"
                />
                <span className="text-gray-400">Cancelled</span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-[#161B24]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-sm flex items-center gap-2 transition shadow-lg"
          >
            <Save className="w-4 h-4" />
            {initialTrade?.id ? 'Update Trade' : 'Save Trade Record'}
          </button>
        </div>
      </div>
    </div>
  );
};
