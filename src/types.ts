export type CurrencyCode = 'INR' | 'USD' | 'GBP' | 'EUR';

export type ThemeName = 'terminal-dark' | 'paper-light' | 'candlestick-ticker' | 'neon-glow';

export type TradeDirection = 'Long' | 'Short';

export type TradeSegment = 'Equity' | 'F&O' | 'Options' | 'Futures' | 'Currency' | 'Commodity';

export type OptionType = 'CE' | 'PE';

export type TradeType = 'Intraday' | 'Swing' | 'Positional' | 'Scalp' | 'Options' | 'Futures' | 'Investment';

export type IncomeCategory = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';

export type TradeStatus = 'Open' | 'Closed' | 'Cancelled';

export type Emotion = 'Calm' | 'Confident' | 'Anxious' | 'Greedy' | 'Fearful' | 'Frustrated' | 'Excited' | 'Neutral';

export type MistakeCategory =
  | 'None'
  | 'FOMO Entry'
  | 'Late Entry'
  | 'Early Exit'
  | 'No Stop Loss'
  | 'Overleveraged'
  | 'Revenge Trade'
  | 'Ignored Plan'
  | 'Chasing Price'
  | 'Other';

export type StrategyType =
  | 'Supply/Demand Zone'
  | 'EMA Stack 9/21/50'
  | 'Breakout'
  | 'Reversal'
  | 'Trend Following'
  | 'Mean Reversion'
  | 'News Play'
  | 'Other';

export type OptionsIndex =
  | 'NIFTY 50'
  | 'BANK NIFTY'
  | 'FIN NIFTY'
  | 'MIDCAP NIFTY'
  | 'NIFTY NEXT 50'
  | 'SENSEX'
  | 'BANKEX'
  | 'Other';

export interface TradeCharges {
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  stt: number;
  sebiCharges: number;
  stampDuty: number;
  otherCharges: number;
}

export interface Trade {
  id: string;
  userId: string;
  tradeDate: string; // YYYY-MM-DD
  stockName: string;
  sector: string;
  exchange: 'NSE' | 'BSE' | 'LSE' | 'NYSE' | 'NASDAQ' | 'Other';
  segment: TradeSegment;
  
  // Options specific fields
  optionsIndex?: OptionsIndex;
  strikePrice?: number;
  optionType?: OptionType;

  direction: TradeDirection;
  tradeType: TradeType;
  incomeCategory: IncomeCategory;
  strategy: StrategyType;

  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  capitalUsed: number;
  leverage: number;

  stopLoss: number;
  target: number;

  charges: TradeCharges;

  entryTime?: string; // HH:mm
  exitTime?: string;  // HH:mm

  status: TradeStatus;

  emotionBefore?: Emotion;
  emotionAfter?: Emotion;
  mistakeCategory?: MistakeCategory;

  notes?: string;
  tradingViewUrl?: string;

  createdAt: number;
  updatedAt: number;
}

export type WatchlistPriority = 'High' | 'Medium' | 'Low';
export type WatchlistStatus = 'Watching' | 'Triggered' | 'Invalid';

export interface WatchlistItem {
  id: string;
  userId: string;
  stockName: string;
  sector: string;
  entryZone: string;
  target: number;
  stopLoss: number;
  reason: string;
  priority: WatchlistPriority;
  status: WatchlistStatus;
  createdAt: number;
}

export type NoteType = 'Daily Note' | 'Weekly Review' | 'Monthly Review' | 'Lesson Learned' | 'Mistake' | 'Idea';

export interface JournalNote {
  id: string;
  userId: string;
  title?: string;
  body: string;
  type: NoteType;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
}

export interface MergedNoteItem {
  id: string;
  source: 'manual' | 'trade';
  title: string;
  body: string;
  type: NoteType | 'Trade Note';
  date: string;
  stockName?: string;
  pnl?: number;
  status?: TradeStatus;
  tradeId?: string;
  createdAt: number;
}

export interface UserSettings {
  userId: string;
  name: string;
  photoUrl?: string;
  currency: CurrencyCode;
  theme: ThemeName;
  brokerName: string;
  initialCapital: number;
  defaultCharges: TradeCharges;
  maxDailyLossPct: number;
  maxWeeklyLossPct: number;
  maxMonthlyLossPct: number;
  updatedAt: number;
}

export interface NiftyStock {
  symbol: string;
  name: string;
  sector: string;
}

export interface TradeCalculations {
  grossPnl: number;
  totalCharges: number;
  netPnl: number;
  roiPct: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  holdingTimeMins?: number;
  isWin: boolean;
}
