import React, { useState } from 'react';
import {
  Settings,
  User,
  Upload,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Save,
  Shield,
  DollarSign,
  Camera,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { UserSettings, CurrencyCode, ThemeName, Trade, WatchlistItem, JournalNote } from '../types';
import { fmtCurrency } from '../lib/calculations';
import { generateExcelReport } from '../lib/excelExport';
import { exportBackup, restoreBackup, BackupData } from '../lib/db';

import { DEFAULT_USER_SETTINGS } from '../data/sampleData';

interface SettingsPageProps {
  settings?: UserSettings;
  trades?: Trade[];
  watchlist?: WatchlistItem[];
  notes?: JournalNote[];
  onSaveSettings?: (settings: UserSettings) => void;
  onOpenAvatarCrop?: (fileSrc: string) => void;
  onOpenAvatarLightbox?: () => void;
  onRefreshData?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  trades = [],
  watchlist = [],
  notes = [],
  onSaveSettings,
  onOpenAvatarCrop,
  onOpenAvatarLightbox,
  onRefreshData
}) => {
  const safeSettings = settings || DEFAULT_USER_SETTINGS;
  const [formData, setFormData] = useState<UserSettings>({ ...safeSettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Excel report range state
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Backup / Restore message state
  const [backupMsg, setBackupMsg] = useState('');

  const currency = formData.currency || 'INR';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onOpenAvatarCrop(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleGenerateExcel = () => {
    generateExcelReport(trades, formData, reportStartDate, reportEndDate);
  };

  const handleDownloadBackup = async () => {
    const backup = await exportBackup(formData.userId);
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data: BackupData = JSON.parse(reader.result as string);
        await restoreBackup(formData.userId, data);
        setBackupMsg('Backup restored successfully! Refreshing data...');
        setTimeout(() => {
          onRefreshData();
          setBackupMsg('');
        }, 1500);
      } catch (err: any) {
        setBackupMsg('Failed to restore backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#12161E] border border-gray-800/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
            Account Preferences & Settings
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Broker charges structure, risk thresholds, currency, & data backup management
          </p>
        </div>

        {saveSuccess && (
          <div className="bg-[#3ED9B8]/20 border border-[#3ED9B8]/40 text-[#3ED9B8] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" />
            Settings Saved
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: PROFILE & BROKER */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <User className="w-5 h-5 text-[#3ED9B8]" />
            Trader Profile & Broker Info
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Circle with Lightbox / Upload Trigger */}
            <div className="relative group shrink-0">
              <div
                onClick={onOpenAvatarLightbox}
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#3ED9B8] bg-gray-900 flex items-center justify-center cursor-pointer shadow-lg"
              >
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#3ED9B8]" />
                )}
              </div>

              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-[#3ED9B8] text-black hover:bg-[#34c4a5] cursor-pointer shadow-md transition">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Trader Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Broker Name</label>
                <select
                  value={formData.brokerName}
                  onChange={e => setFormData({ ...formData, brokerName: e.target.value })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Zerodha Broking">Zerodha Broking</option>
                  <option value="Groww">Groww</option>
                  <option value="AngelOne">AngelOne</option>
                  <option value="Upstox">Upstox</option>
                  <option value="Interactive Brokers">Interactive Brokers</option>
                  <option value="Custom Broker">Custom Broker</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Account Currency</label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Initial Starting Capital ({currency})</label>
                <input
                  type="number"
                  value={formData.initialCapital}
                  onChange={e => setFormData({ ...formData, initialCapital: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DEFAULT BROKERAGE & CHARGES */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#3ED9B8]" />
            Default Brokerage & Transaction Charges Preset ({currency})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Brokerage</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.brokerage}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, brokerage: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Exchange</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.exchangeCharges}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, exchangeCharges: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">GST</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.gst}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, gst: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">STT</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.stt}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, stt: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">SEBI</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.sebiCharges}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, sebiCharges: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Stamp Duty</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.stampDuty}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, stampDuty: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Other</label>
              <input
                type="number"
                step="0.1"
                value={formData.defaultCharges.otherCharges}
                onChange={e => setFormData({
                  ...formData,
                  defaultCharges: { ...formData.defaultCharges, otherCharges: parseFloat(e.target.value) || 0 }
                })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl p-2 font-mono text-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: RISK LIMITS */}
        <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#3ED9B8]" />
            Risk Drawdown Thresholds (%)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Max Daily Loss Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.maxDailyLossPct}
                onChange={e => setFormData({ ...formData, maxDailyLossPct: parseFloat(e.target.value) || 1 })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Max Weekly Loss Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.maxWeeklyLossPct}
                onChange={e => setFormData({ ...formData, maxWeeklyLossPct: parseFloat(e.target.value) || 3 })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Max Monthly Loss Limit (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.maxMonthlyLossPct}
                onChange={e => setFormData({ ...formData, maxMonthlyLossPct: parseFloat(e.target.value) || 10 })}
                className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-sm flex items-center gap-2 transition shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </form>

      {/* SECTION 4: EXCEL REPORT GENERATOR */}
      <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#3ED9B8]" />
          Custom Period Excel Report Generator
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={e => setReportStartDate(e.target.value)}
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={e => setReportEndDate(e.target.value)}
              className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateExcel}
              className="w-full py-2 rounded-xl bg-[#191F2A] hover:bg-[#222a38] text-[#3ED9B8] font-semibold text-xs border border-gray-800 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              Download .XLSX Report
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 5: BACKUP & RESTORE DATA */}
      <div className="bg-[#12161E] border border-gray-800/90 p-5 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#3ED9B8]" />
          Backup & Data Restoration
        </h3>

        {backupMsg && (
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{backupMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#161B24] p-4 rounded-xl border border-gray-800 space-y-2">
            <h4 className="font-semibold text-white">Export Local Backup</h4>
            <p className="text-gray-400 text-[11px]">
              Download full JSON snapshot of trades, watchlist, notes, and preferences.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-[#191F2A] hover:bg-[#222a38] text-white border border-gray-700 rounded-xl font-medium"
            >
              Export Backup JSON
            </button>
          </div>

          <div className="bg-[#161B24] p-4 rounded-xl border border-gray-800 space-y-2">
            <h4 className="font-semibold text-white">Restore Data Backup</h4>
            <p className="text-gray-400 text-[11px]">
              Upload a previously saved .json backup file to overwrite/restore journal state.
            </p>
            <label className="inline-block px-4 py-2 bg-[#191F2A] hover:bg-[#222a38] text-white border border-gray-700 rounded-xl font-medium cursor-pointer">
              Choose Backup JSON File
              <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
