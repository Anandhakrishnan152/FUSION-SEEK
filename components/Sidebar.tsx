import React from 'react';
import {
    Cpu,
    Search,
    Database,
    User,
    Network,
    History,
    BarChart3,
    Settings,
    Loader2,
    Upload
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
    theme: 'light' | 'dark';
    view: ViewType;
    setView: (view: ViewType) => void;
    isIndexing: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    theme,
    view,
    setView,
    isIndexing,
    fileInputRef,
    handleFileUpload
}) => {
    return (
        <aside className={`w-20 lg:w-72 flex flex-col border-r z-50 transition-all duration-500 ${theme === 'dark' ? 'border-white/5 glass' : 'border-slate-200 bg-white/80 backdrop-blur-xl'
            }`}>
            <div className="p-6 flex items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setView('chat')}>
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                    <div className={`relative rounded-xl p-2.5 ${theme === 'dark' ? 'bg-black' : 'bg-white shadow-md'}`}>
                        <Cpu className="text-white w-6 h-6 animate-pulse" />
                    </div>
                </div>
                <div className="hidden lg:block overflow-hidden">
                    <h1 className={`text-lg font-black tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>FUSIONSEEK</h1>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">The Neural Pulse of Your Data</p>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {[
                    { id: 'chat', label: 'Search Interface', icon: Search, desc: 'Natural Language' },
                    { id: 'profile', label: 'Identity Node', icon: User, desc: 'Operative Access' },
                    { id: 'vault', label: 'Multimodal Vault', icon: Database, desc: 'Local Indices' },
                    { id: 'blockchain', label: 'Chain Ledger', icon: Network, desc: 'Provenance' },
                    { id: 'history', label: 'Activity Logs', icon: History, desc: 'Past Searches' },
                    { id: 'analytics', label: 'Dashboard', icon: BarChart3, desc: 'Insights' },
                    { id: 'settings', label: 'Configuration', icon: Settings, desc: 'System' }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as ViewType)}
                        className={`w-full group relative flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 ${view === item.id
                            ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                            : theme === 'dark' ? 'text-slate-500 hover:text-slate-200 hover:bg-white/5' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                    >
                        <item.icon size={22} className={view === item.id ? 'animate-float' : ''} />
                        <div className="hidden lg:block text-left">
                            <div className="text-sm font-bold tracking-tight">{item.label}</div>
                            <div className="text-[9px] font-medium uppercase tracking-wider opacity-60">{item.desc}</div>
                        </div>
                    </button>
                ))}
            </nav>

            <div className="p-6 space-y-6">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isIndexing}
                    className={`w-full p-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group ${theme === 'dark' ? 'bg-white text-slate-950' : 'bg-slate-900 text-white'
                        }`}
                >
                    {isIndexing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span className="hidden lg:inline">{isIndexing ? 'Ingesting...' : 'Ingest Data'}</span>
                </button>
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </div>
        </aside>
    );
};
