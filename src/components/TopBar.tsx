import React from 'react';
import { Coffee, Plus, History, LineChart, Layers, Bookmark, Download, Sliders, Droplets } from 'lucide-react';
import { BeanBag, GrinderProfile, MachineProfile, BasketProfile, WaterRecipe } from '../types/espresso';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  currentTab: 'log' | 'history' | 'analytics' | 'beans' | 'grinders' | 'water' | 'presets';
  onSelectTab: (tab: 'log' | 'history' | 'analytics' | 'beans' | 'grinders' | 'water' | 'presets') => void;
  onSelectEquipmentSection: (section: 'grinders' | 'machines' | 'baskets') => void;
  onNewShot: () => void;
  activeBean?: BeanBag;
  activeGrinder?: GrinderProfile;
  activeMachine?: MachineProfile;
  activeBasket?: BasketProfile;
  activeWaterRecipe?: WaterRecipe;
  totalShotsCount: number;
  onOpenDataModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onSelectEquipmentSection,
  onNewShot,
  activeBean,
  activeGrinder,
  activeMachine,
  activeBasket,
  activeWaterRecipe,
  totalShotsCount,
  onOpenDataModal,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0e1015]/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 3-zone Header Contract */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coffee className="w-5 h-5" />
            </div>
            <button
              onClick={() => onSelectTab('log')}
              className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>ExtractionLab</span>
              <span className="text-xs font-mono font-normal text-amber-500/80 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                PRO
              </span>
            </button>
          </div>

          {/* Zone 2: single-line navigation links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-sm font-medium">
            <button
              onClick={() => onSelectTab('log')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'log'
                  ? 'border-amber-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Log Shot</span>
            </button>
            <button
              onClick={() => onSelectTab('history')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'history'
                  ? 'border-amber-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4 opacity-70" />
              <span>Shot History ({totalShotsCount})</span>
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'analytics'
                  ? 'border-amber-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-4 h-4 opacity-70" />
              <span>Dial-In Curve</span>
            </button>
            <button
              onClick={() => onSelectTab('beans')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'beans'
                  ? 'border-amber-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 opacity-70" />
              <span>Bean Bags</span>
            </button>
            <button
              onClick={() => onSelectTab('grinders')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'grinders'
                  ? 'border-amber-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 opacity-70" />
              <span>Equipment</span>
            </button>
            <button
              onClick={() => onSelectTab('water')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'water'
                  ? 'border-sky-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplets className="w-4 h-4 opacity-70" />
              <span>Water</span>
            </button>
            <button
              onClick={() => onSelectTab('presets')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'presets'
                  ? 'border-amber-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-4 h-4 opacity-70" />
              <span>Presets</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action button + install & data buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />

            <button
              onClick={onOpenDataModal}
              title="Backup & Export CSV/JSON"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Export or import data"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onNewShot}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Shot</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="flex md:hidden items-center justify-between border-t border-slate-800/80 py-2 overflow-x-auto no-scrollbar gap-2 text-xs">
          <button
            onClick={() => onSelectTab('log')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'log' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            Log Shot
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'history' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            History ({totalShotsCount})
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'analytics' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectTab('beans')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'beans' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            Beans
          </button>
          <button
            onClick={() => onSelectTab('grinders')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'grinders' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            Equipment
          </button>
          <button
            onClick={() => onSelectTab('water')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'water' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400'
            }`}
          >
            Water
          </button>
          <button
            onClick={() => onSelectTab('presets')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              currentTab === 'presets' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            Presets
          </button>
        </div>
      </div>

      {/* Active Coffee Bean & Grinder Telemetry Ribbon */}
      <div className="border-t border-slate-800/50 bg-[#12151c] px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-slate-400 flex items-center justify-between overflow-x-auto gap-4">
        <div className="flex items-center gap-4 whitespace-nowrap">
          {activeBean && (
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500/90 font-medium">Bean:</span>
              <span className="text-slate-200 font-semibold">{activeBean.name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{activeBean.roaster}</span>
              <button
                onClick={() => onSelectTab('beans')}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline ml-1 font-mono"
              >
                Change
              </button>
            </div>
          )}

          {activeGrinder && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <span className="text-amber-500/90 font-medium">Grinder:</span>
              <span className="text-slate-200 font-semibold">{activeGrinder.name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400 font-mono text-[11px]">
                Zero: {activeGrinder.zeroSetting > 0 ? `+${activeGrinder.zeroSetting}` : activeGrinder.zeroSetting} {activeGrinder.unit || 'marks'}
              </span>
              <button
                onClick={() => onSelectEquipmentSection('grinders')}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline ml-1 font-mono"
              >
                Switch
              </button>
            </div>
          )}

          {activeMachine && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <span className="text-amber-500/90 font-medium">Machine:</span>
              <span className="text-slate-200 font-semibold">{activeMachine.name}</span>
              <button
                onClick={() => onSelectEquipmentSection('machines')}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline ml-1 font-mono"
              >
                Switch
              </button>
            </div>
          )}

          {activeBasket && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <span className="text-amber-500/90 font-medium">Basket:</span>
              <span className="text-slate-200 font-semibold">{activeBasket.name}</span>
              <button
                onClick={() => onSelectEquipmentSection('baskets')}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline ml-1 font-mono"
              >
                Switch
              </button>
            </div>
          )}

          {activeWaterRecipe && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
              <span className="text-sky-400/90 font-medium">Water:</span>
              <span className="text-slate-200 font-semibold">{activeWaterRecipe.name}</span>
              <button
                onClick={() => onSelectTab('water')}
                className="text-[11px] text-sky-400 hover:text-sky-300 underline ml-1 font-mono"
              >
                Switch
              </button>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-500 shrink-0">
          <span>Actual = Dial − Zero</span>
        </div>
      </div>
    </header>
  );
};
