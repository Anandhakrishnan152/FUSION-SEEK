import React from 'react';
import {
    User,
    Fingerprint,
    Award,
    CreditCard
} from 'lucide-react';

interface ProfileViewProps {
    theme: 'light' | 'dark';
}

export const ProfileView: React.FC<ProfileViewProps> = ({ theme }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-12 animate-slide-up">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-8 md:mb-12 text-center md:text-left">
                    <div className={`p-6 rounded-[2rem] shadow-2xl inline-flex ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}>
                        <User size={40} />
                    </div>
                    <div>
                        <h2 className={`text-3xl md:text-5xl font-black italic uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Identity Node</h2>
                        <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em]">Operative Profile & Stats</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* ID Card */}
                    <div className={`lg:col-span-1 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group ${theme === 'dark' ? 'glass border-white/10' : 'bg-white border border-slate-200 shadow-xl'
                        }`}>
                        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                        <div className="absolute top-8 right-8 text-indigo-400 animate-pulse">
                            <Fingerprint size={32} />
                        </div>

                        <div className="mt-8 mb-6">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-3xl font-black text-white shadow-inner mb-4">
                                OP
                            </div>
                            <h3 className={`text-2xl font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Operative 7</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Link Active</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-dashed border-slate-700/20">
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Clearance Level</div>
                                <div className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Level 5 (Architect)</div>
                            </div>
                            <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit ID</div>
                                <div className="font-mono text-xs text-indigo-500">UID-7749-XF-22</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Achievements */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className={`p-6 rounded-[2rem] md:rounded-[2.5rem] ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-100 shadow-lg'}`}>
                                <div className="flex items-center gap-3 mb-4 text-emerald-500">
                                    <Award size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Achievements</span>
                                </div>
                                <div className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>12 / 50</div>
                                <div className="text-xs font-medium text-slate-500">Badges Unlocked</div>
                            </div>
                            <div className={`p-6 rounded-[2rem] md:rounded-[2.5rem] ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-white border border-slate-100 shadow-lg'}`}>
                                <div className="flex items-center gap-3 mb-4 text-amber-500">
                                    <CreditCard size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tokens Remaining</span>
                                </div>
                                <div className={`text-3xl font-black mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>8,450</div>
                                <div className="text-xs font-medium text-slate-500">Compute Credits</div>
                            </div>
                        </div>

                        {/* Neural bio */}
                        <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ${theme === 'dark' ? 'glass border-white/5' : 'bg-white border border-slate-200 shadow-xl'}`}>
                            <h4 className={`text-lg font-black uppercase italic mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Bio-Digital Signature</h4>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Primary architect of the FusionSeek protocol. Specialized in multimodal vector synthesis and cryptographic provenance tracking. Currently synchronizing across 4 distributed neural nodes.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {['Neural Architect', 'Vector Specialist', 'Crypto-Secured', 'Node Operator'].map(tag => (
                                    <span key={tag} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${theme === 'dark'
                                        ? 'bg-white/5 text-slate-300 border border-white/5'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ${theme === 'dark' ? 'bg-indigo-600/10 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
                            <h4 className={`text-lg font-black uppercase italic mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Node Registration</h4>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button className="flex-1 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    Create New Identity
                                </button>
                                <button className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] border transition-all hover:scale-[1.02] active:scale-[0.98] ${theme === 'dark' ? 'border-white/20 hover:bg-white/5 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    Switch Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
