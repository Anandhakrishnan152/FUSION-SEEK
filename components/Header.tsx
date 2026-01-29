import React from 'react';
import {
    Server,
    Sun,
    Moon,
    Clock,
    BarChart3,
    Settings,
    Mic,
    Volume2
} from 'lucide-react';
import { ViewType } from '../types';

interface HeaderProps {
    theme: 'light' | 'dark';
    setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
    view: ViewType;
    setView: (view: ViewType) => void;
    isIndexing: boolean;
    setShowDinoGame: (show: boolean) => void;
    voiceMode?: boolean;
    setVoiceMode?: (mode: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    theme,
    setTheme,
    view,
    setView,
    isIndexing,
    setShowDinoGame,
    voiceMode = false,
    setVoiceMode = (_mode: boolean) => { }
}) => {
    return (
        <header className={`h-16 flex items-center justify-between px-4 md:px-8 border-b z-40 ${theme === 'dark' ? 'border-white/5 glass' : 'border-slate-200 bg-white/50 backdrop-blur-md'
            }`}>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-emerald-400">
                    <div className={`w-2 h-2 rounded-full ${isIndexing ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_10px_#10b981]`}></div>
                    <button onClick={() => setShowDinoGame(true)} className={`text-[11px] font-black uppercase tracking-widest transition-colors text-left group ${theme === 'dark' ? 'hover:text-white' : 'hover:text-indigo-600'}`}>
                        <span className="md:inline hidden">{isIndexing ? 'Ingesting Nodes' : 'Nodes Online'}</span>
                        <span className="md:hidden inline">Online</span>
                        <span className="hidden group-hover:inline ml-2 text-[9px] text-rose-500 animate-pulse">(SYNC ERROR?)</span>
                    </button>
                </div>
                <div className={`hidden sm:block h-4 w-px ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-300'}`}></div>
                <div className={`hidden sm:flex items-center gap-3 text-[11px] font-bold cursor-pointer transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}`} onClick={() => setShowDinoGame(true)}>
                    <Server size={14} />
                    <span className="mono">0x{Math.random().toString(16).substr(2, 6).toUpperCase()}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {/* Animated Theme Toggle */}
                <button
                    onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                    className={`relative w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden group shadow-lg hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        }`}
                >
                    <div className={`absolute inset-0 transition-transform duration-500 ${theme === 'dark' ? 'rotate-0' : 'rotate-180'}`}>
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
                            <Sun size={20} className="animate-spin-slow" />
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${theme === 'light' ? 'opacity-100' : 'opacity-0'} rotate-180`}>
                            <Moon size={20} className="animate-pulse" />
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setVoiceMode(!voiceMode)}
                    className={`p-2.5 rounded-xl transition-colors ${voiceMode
                        ? (theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600')
                        : (theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600')
                        }`}
                    title="Toggle Voice Output"
                >
                    {voiceMode ? <Volume2 size={18} className="animate-pulse" /> : <Volume2 size={18} />}
                </button>

                <button onClick={() => setView('history')} className={`hidden md:block p-2.5 rounded-xl transition-colors ${view === 'history'
                    ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-indigo-100 text-indigo-600')
                    : (theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600')
                    }`}>
                    <Clock size={18} />
                </button>
                <button onClick={() => setView('analytics')} className={`hidden md:block p-2.5 rounded-xl transition-colors ${view === 'analytics'
                    ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-indigo-100 text-indigo-600')
                    : (theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600')
                    }`}>
                    <BarChart3 size={18} />
                </button>
                <button onClick={() => setView('settings')} className={`hidden md:block p-2.5 rounded-xl transition-colors ${view === 'settings'
                    ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-indigo-100 text-indigo-600')
                    : (theme === 'dark' ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600')
                    }`}>
                    <Settings size={18} />
                </button>
                <button onClick={() => setView('profile')} title="Access Identity Profile" className="focus:outline-none hover:scale-105 transition-transform active:scale-95">
                    <img
                        src="/FS_Logo_Original.png"
                        alt="Fusion Seek Profile"
                        className="w-10 h-10 rounded-2xl shadow-lg object-contain bg-transparent"
                    />
                </button>
            </div>
        </header>
    );
};
