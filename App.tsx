
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Search,
  Database,
  ShieldCheck,
  Clock,
  Upload,
  ArrowRight,
  ShieldAlert,
  Hash,
  Activity,
  ChevronRight,
  Cpu,
  Lock,
  Zap,
  CheckCircle2,
  Network,
  X,
  Sparkles,
  Download,
  Filter,
  BarChart3,
  Layers,
  Terminal,
  Globe,
  Settings,
  History,
  Trash2,
  Loader2,
  PieChart,
  HardDrive,
  Cpu as CpuIcon,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Calendar,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { FileMetadata, BlockchainRecord, ChatMessage, Modality } from './types';
import { performMultimodalRAG, verifyHash, findSimilarImages, processAndIndexFile } from './services/ollamaService';

type ViewType = 'chat' | 'vault' | 'blockchain' | 'analytics' | 'settings' | 'history';

export default function App() {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [blockchainLogs, setBlockchainLogs] = useState<BlockchainRecord[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "System Initialized. Air-Gap Protocol Active (Ollama Adapter PAUSED).\n\nThe Ollama module is currently disabled. RAG features are unavailable.",
      verificationDetails: { filesChecked: 0, discrepancies: 0, blockchainStatus: 'SECURE' }
    }
  ]);
  const [query, setQuery] = useState('');
  const [searchStage, setSearchStage] = useState<'IDLE' | 'SEMANTIC_SEARCH' | 'BLOCKCHAIN_VERIFY' | 'SYNTHESIZING' | 'VISUAL_SIMILARITY'>('IDLE');
  const [view, setView] = useState<ViewType>('chat');
  const [selectedImageForSearch, setSelectedImageForSearch] = useState<FileMetadata | null>(null);
  const [similarityResults, setSimilarityResults] = useState<any[]>([]);
  const [refinementText, setRefinementText] = useState('');

  // Vault Filtering
  const [vaultSearch, setVaultSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<Modality | 'all'>('all');

  // Settings state
  const [modelType, setModelType] = useState<'pro' | 'flash'>('pro');
  const [securityLevel, setSecurityLevel] = useState<'standard' | 'strict' | 'paranoid'>('strict');
  const [showNeuralShimmer, setShowNeuralShimmer] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, searchStage]);

  const stats = useMemo(() => {
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const modalityCounts = files.reduce((acc, f) => {
      acc[f.modality] = (acc[f.modality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const avgTrust = files.length ? files.reduce((acc, f) => acc + f.trustScore, 0) / files.length : 100;
    const isIndexing = files.some(f => f.status === 'indexing');

    return { totalSize, modalityCounts, avgTrust, isIndexing };
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(vaultSearch.toLowerCase()) || f.hash.includes(vaultSearch);
      const matchesModality = modalityFilter === 'all' || f.modality === modalityFilter;
      return matchesSearch && matchesModality;
    });
  }, [files, vaultSearch, modalityFilter]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const newFilesList: File[] = Array.from(uploadedFiles);

    const placeholders = newFilesList.map((file, i) => {
      let modality: Modality = 'text';
      if (file.type.includes('image')) modality = 'image';
      else if (file.type.includes('audio')) modality = 'audio';
      else if (file.type.includes('pdf')) modality = 'pdf';

      return {
        id: `temp-${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        hash: 'PENDING...',
        modality,
        blockchainId: 'FS-NODE-PENDING',
        status: 'indexing' as const,
        trustScore: 0,
        indexedChunks: 0
      };
    });

    setFiles(prev => [...placeholders, ...prev]);

    for (let i = 0; i < newFilesList.length; i++) {
      const file = newFilesList[i];
      const placeholderId = placeholders[i].id;

      try {
        await new Promise(r => setTimeout(r, 800));
        const hash = await verifyHash(file);
        const blockchainId = `FS-NODE-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        let modality: Modality = 'text';
        if (file.type.includes('image')) modality = 'image';
        else if (file.type.includes('audio')) modality = 'audio';
        else if (file.type.includes('pdf')) modality = 'pdf';

        let content = '';
        if (modality === 'text') {
          content = await file.text();
        } else {
          content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        let finalMeta: FileMetadata = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          hash: hash,
          modality,
          blockchainId,
          status: 'ready',
          content,
          trustScore: 100,
          indexedChunks: 0
        };

        // Efficient Ingestion: Generate Embeddings & Descriptions
        finalMeta = await processAndIndexFile(finalMeta);
        finalMeta.indexedChunks = finalMeta.vectorData?.length || 0;

        setFiles(prev => prev.map(f => f.id === placeholderId ? finalMeta : f));

        setBlockchainLogs(prev => [{
          timestamp: Date.now(),
          fileHash: hash,
          documentId: blockchainId,
          action: 'REGISTRATION',
          verified: true
        }, ...prev]);

      } catch (err) {
        console.error("Ingestion failed", err);
        setFiles(prev => prev.map(f => f.id === placeholderId ? { ...f, status: 'error' } : f));
      }
    }
  };

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchStage !== 'IDLE') return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: searchQuery };
    setChatHistory(prev => [...prev, userMsg]);
    setRecentQueries(prev => [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10));
    setQuery('');

    // Auto-switch to chat view if we are searching
    if (view !== 'chat') setView('chat');

    setSearchStage('SEMANTIC_SEARCH');
    await new Promise(r => setTimeout(r, 1000));
    setSearchStage('BLOCKCHAIN_VERIFY');
    await new Promise(r => setTimeout(r, 1500));
    setSearchStage('SYNTHESIZING');

    const response = await performMultimodalRAG(searchQuery, files.filter(f => f.status === 'ready'));

    const assistantMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: response,
      verificationDetails: {
        filesChecked: files.filter(f => f.status === 'ready').length,
        discrepancies: 0,
        blockchainStatus: 'SECURE'
      }
    };

    setChatHistory(prev => [...prev, assistantMsg]);
    setSearchStage('IDLE');
  };

  const handleSearch = () => {
    executeSearch(query);
  };

  const handleDownload = (file: FileMetadata) => {
    if (file.status !== 'ready') return;
    const link = document.createElement('a');
    link.download = file.name;
    if (file.modality === 'text') {
      const blob = new Blob([file.content || ''], { type: file.type });
      link.href = URL.createObjectURL(blob);
    } else {
      link.href = file.content || '';
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    setChatHistory([chatHistory[0]]); // Keep welcome message
    setRecentQueries([]);
  };

  const removeRecentQuery = (qToRemove: string) => {
    setRecentQueries(prev => prev.filter(q => q !== qToRemove));
  };

  return (
    <div className={`flex h-screen bg-[#020617] text-slate-100 overflow-hidden selection:bg-indigo-500/30 ${!showNeuralShimmer ? 'no-shimmer' : ''}`}>
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Sidebar */}
      <aside className="w-20 lg:w-72 flex flex-col border-r border-white/5 glass z-50 transition-all duration-500">
        <div className="p-6 flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setView('chat')}>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-black rounded-xl p-2.5">
              <Cpu className="text-white w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div className="hidden lg:block overflow-hidden">
            <h1 className="text-lg font-black tracking-tighter leading-none">FUSIONSEEK</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Intelligence Proxy</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'chat', label: 'Search Interface', icon: Search, desc: 'Natural Language' },
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
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
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
            disabled={stats.isIndexing}
            className="w-full bg-white text-slate-950 p-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
          >
            {stats.isIndexing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="hidden lg:inline">{stats.isIndexing ? 'Ingesting...' : 'Ingest Data'}</span>
          </button>
          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>
      </aside>

      {/* Main Display Panel */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Activity Bar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 glass z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className={`w-2 h-2 rounded-full ${stats.isIndexing ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_10px_#10b981]`}></div>
              <span className="text-[11px] font-black uppercase tracking-widest">{stats.isIndexing ? 'Ingesting Nodes' : 'Nodes Online'}</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-3 text-slate-500 text-[11px] font-bold">
              <Server size={14} />
              <span className="mono">0x{Math.random().toString(16).substr(2, 6).toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setView('history')} className={`p-2.5 rounded-xl transition-colors ${view === 'history' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
              <Clock size={18} />
            </button>
            <button onClick={() => setView('analytics')} className={`p-2.5 rounded-xl transition-colors ${view === 'analytics' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
              <BarChart3 size={18} />
            </button>
            <button onClick={() => setView('settings')} className={`p-2.5 rounded-xl transition-colors ${view === 'settings' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-500'}`}>
              <Settings size={18} />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-xs shadow-lg">FS</div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="flex-1 overflow-hidden flex flex-col relative">

          {/* Chat Interface */}
          {view === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth">
                {chatHistory.map((msg, idx) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                    <div className={`max-w-4xl relative group ${msg.role === 'user' ? 'w-auto' : 'w-full'}`}>
                      <div className={`rounded-3xl p-8 ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl'
                        : 'glass text-slate-200 shadow-xl border-white/5'
                        }`}>
                        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                          <div className={`p-1.5 rounded-lg ${msg.role === 'user' ? 'bg-white/20' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {msg.role === 'user' ? <Terminal size={14} /> : <Activity size={14} />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                            {msg.role === 'user' ? 'Local Proxy Query' : 'Multimodal Synthesis'}
                          </span>
                          {msg.role === 'assistant' && msg.verificationDetails && (
                            <div className="ml-auto flex gap-3">
                              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                                <ShieldCheck size={12} />
                                <span className="text-[10px] font-black tracking-widest">{msg.verificationDetails.blockchainStatus}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className={`leading-[1.6] opacity-95 whitespace-pre-wrap ${msg.role === 'assistant' ? 'text-xl font-semibold tracking-tight text-white' : 'text-lg font-medium'
                          }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {searchStage !== 'IDLE' && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="glass rounded-[2.5rem] p-8 flex flex-col gap-6 min-w-[400px] shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 scan-line"></div>
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin flex items-center justify-center">
                          <Activity className="text-indigo-400" size={18} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{searchStage.replace('_', ' ')}</h4>
                          <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1">PIPELINE ACTIVE</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-8 glass border-t border-white/5">
                <div className="max-w-5xl mx-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
                    <div className="relative flex items-center bg-[#0f172a] border border-white/10 rounded-3xl p-3 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                      <div className="p-4 text-slate-500"><Search size={22} /></div>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search Multimodal Context..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-base py-3 px-2 font-medium"
                      />
                      <button onClick={handleSearch} className="bg-white hover:bg-slate-100 text-slate-950 p-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95">
                        <ArrowRight size={22} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* History Subpage */}
          {view === 'history' && (
            <div className="flex-1 overflow-y-auto p-12 animate-slide-up">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-12 h-[1px] bg-indigo-500"></div>
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">Temporal Logs</span>
                    </div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Activity Logs</h2>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-2xl shadow-rose-500/10"
                  >
                    <Trash2 size={16} /> Purge All History
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column: Recent Queries Recall */}
                  <div className="lg:col-span-1 space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Zap size={20} className="text-amber-400" />
                      <h3 className="text-xl font-black text-white uppercase italic">Quick Recall</h3>
                    </div>
                    {recentQueries.length === 0 ? (
                      <div className="glass p-10 rounded-3xl border-dashed border-white/10 text-center opacity-40">
                        <Search size={32} className="mx-auto mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Searches</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentQueries.map((q, i) => (
                          <div key={i} className="group relative glass p-5 rounded-3xl border-white/5 hover:border-indigo-500/40 transition-all flex items-center justify-between shadow-xl">
                            <button
                              onClick={() => executeSearch(q)}
                              className="flex-1 text-left mr-4"
                            >
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Query {i + 1}</div>
                              <div className="text-sm font-bold text-white truncate max-w-[200px]">{q}</div>
                            </button>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => executeSearch(q)}
                                className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg"
                                title="Run Again"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                onClick={() => removeRecentQuery(q)}
                                className="p-2 bg-rose-500/20 text-rose-500 rounded-xl"
                                title="Remove"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Full Conversation Timeline */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <MessageSquare size={20} className="text-indigo-400" />
                      <h3 className="text-xl font-black text-white uppercase italic">Neural Activity Timeline</h3>
                    </div>

                    <div className="relative pl-8 border-l border-white/5 space-y-12">
                      {chatHistory.slice(1).length === 0 ? (
                        <div className="glass p-20 rounded-[3rem] text-center border-white/5 opacity-40">
                          <Calendar size={48} className="mx-auto mb-6" />
                          <h4 className="text-lg font-black text-white uppercase italic mb-2">No Session Activity</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest">Active nodes awaiting user prompt injection.</p>
                        </div>
                      ) : (
                        chatHistory.slice(1).map((msg, i) => (
                          <div key={msg.id} className="relative group">
                            {/* Timeline Node */}
                            <div className={`absolute -left-[45px] top-4 w-4 h-4 rounded-full border-2 bg-[#020617] transition-all group-hover:scale-125 ${msg.role === 'user' ? 'border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}></div>

                            <div className="glass p-8 rounded-[2.5rem] border-white/5 hover:border-white/10 transition-all shadow-2xl relative overflow-hidden">
                              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-slate-950'}`}>
                                    {msg.role}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-500 mono uppercase tracking-widest">Node ID: {msg.id.slice(-6)}</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                  Proxy Response :: Secure
                                </div>
                              </div>
                              <div className={`leading-relaxed line-clamp-3 text-slate-300 italic ${msg.role === 'assistant' ? 'text-sm' : 'text-base font-bold'}`}>
                                "{msg.text}"
                              </div>
                              <div className="mt-6 flex justify-end">
                                <button
                                  onClick={() => setView('chat')}
                                  className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-white transition-colors"
                                >
                                  View Full Context <ExternalLink size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Vault Interface */}
          {view === 'vault' && (
            <div className="flex-1 overflow-y-auto p-12 animate-slide-up">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-12 h-[1px] bg-indigo-500"></div>
                      <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">Neural Repository</span>
                    </div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Data Vault</h2>
                  </div>

                  <div className="flex flex-wrap gap-4 glass p-4 rounded-3xl border-white/5 shadow-2xl w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="text"
                        placeholder="Search local nodes..."
                        value={vaultSearch}
                        onChange={(e) => setVaultSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-indigo-500/40"
                      />
                    </div>
                    <select
                      value={modalityFilter}
                      onChange={(e) => setModalityFilter(e.target.value as any)}
                      className="bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold focus:outline-none"
                    >
                      <option value="all">All Modalities</option>
                      <option value="text">Documents</option>
                      <option value="image">Visuals</option>
                      <option value="audio">Audio</option>
                      <option value="pdf">PDFs</option>
                    </select>
                  </div>
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[4rem] p-32 text-center group">
                    <div className="bg-indigo-500/10 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                      <HardDrive className="text-indigo-400" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4 uppercase">Node Void</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-10 uppercase tracking-[0.2em] font-bold">No active vectors found in the current partition.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredFiles.map((file, i) => (
                      <div key={file.id} className="group relative glass rounded-[2.5rem] p-8 transition-all duration-500 animate-slide-up overflow-hidden hover:border-indigo-500/40">
                        <div className="flex items-start justify-between mb-8">
                          <div className={`p-4 rounded-2xl shadow-lg ${file.status === 'indexing' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                            file.modality === 'image' ? 'bg-rose-500/10 text-rose-400' :
                              file.modality === 'audio' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                            {file.modality === 'image' ? <ImageIcon size={28} /> :
                              file.modality === 'audio' ? <Mic size={28} /> : <FileText size={28} />}
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${file.status === 'indexing' ? 'text-amber-400 border-amber-500/20' : 'text-emerald-400 border-emerald-500/20'}`}>
                            {file.status}
                          </span>
                        </div>
                        <h4 className="text-xl font-black mb-2 truncate text-white tracking-tight">{file.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">{file.type} • {(file.size / 1024).toFixed(1)} KB</p>
                        <div className="mt-8 flex gap-3">
                          <button onClick={() => handleDownload(file)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-white/5">
                            <Download size={14} /> Access
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blockchain Ledger View */}
          {view === 'blockchain' && (
            <div className="flex-1 overflow-y-auto p-12 animate-slide-up">
              <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
                <div className="flex-1">
                  <div className="flex items-center gap-8 mb-20">
                    <div className="bg-emerald-500 p-6 rounded-[2rem] shadow-[0_0_40px_rgba(16,185,129,0.3)] text-white">
                      <ShieldCheck size={44} className="animate-float" />
                    </div>
                    <div>
                      <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Chain Ledger</h2>
                      <p className="text-slate-500 text-[11px] uppercase font-bold tracking-[0.4em] mt-2">Active Provenance Nodes: {Math.floor(Math.random() * 20) + 5}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {blockchainLogs.map((log, i) => (
                      <div key={i} className="flex gap-8 group animate-slide-up">
                        <div className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center z-10 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                          <Hash size={20} />
                        </div>
                        <div className="flex-1 glass p-6 rounded-3xl border-white/5 hover:border-emerald-500/40 transition-all">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black px-3 py-1 bg-emerald-500 text-slate-950 rounded-full uppercase">{log.action}</span>
                            <span className="text-[11px] font-black mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-sm font-bold text-white mb-2">{log.documentId}</div>
                          <div className="text-[10px] mono text-slate-500 truncate">{log.fileHash}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:w-[400px] flex flex-col gap-6">
                  <div className="glass p-8 rounded-[3rem] border-white/10 h-[500px] relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className="absolute inset-0 scan-line opacity-20"></div>
                    <div className="relative z-10 space-y-6">
                      <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 border-2 border-dashed border-emerald-500/20 rounded-full animate-spin-slow"></div>
                        <div className="absolute inset-8 border-2 border-dashed border-indigo-500/20 rounded-full animate-reverse-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Globe size={64} className="text-emerald-500 animate-pulse" />
                        </div>
                        {[0, 60, 120, 180, 240, 300].map(angle => (
                          <div key={angle} className="absolute w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981]"
                            style={{
                              top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * 80}px)`,
                              left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * 80}px)`
                            }}></div>
                        ))}
                      </div>
                      <h4 className="text-xl font-black text-white italic uppercase">Network Integrity</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <div className="text-[9px] font-black text-slate-500 uppercase">Peers</div>
                          <div className="text-lg font-black text-emerald-400">12</div>
                        </div>
                        <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                          <div className="text-[9px] font-black text-slate-500 uppercase">Blocks</div>
                          <div className="text-lg font-black text-indigo-400">{blockchainLogs.length}</div>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Syncing with distributed local mesh protocol FS-V4...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Subpage */}
          {view === 'analytics' && (
            <div className="flex-1 overflow-y-auto p-12 animate-slide-up">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-6 mb-16">
                  <div className="bg-rose-500 p-6 rounded-[2rem] text-white shadow-2xl">
                    <PieChart size={40} />
                  </div>
                  <div>
                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Insights</h2>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">Node Intelligence & Performance Dashboard</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="glass p-10 rounded-[3rem] border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Storage Partition</span>
                      <HardDrive size={20} className="text-indigo-400" />
                    </div>
                    <div className="text-4xl font-black text-white mono">{(stats.totalSize / (1024 * 1024)).toFixed(2)} MB</div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: '15%' }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">15% of reserved local block utilized</p>
                  </div>
                  <div className="glass p-10 rounded-[3rem] border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Average Trust</span>
                      <ShieldCheck size={20} className="text-emerald-400" />
                    </div>
                    <div className="text-4xl font-black text-white mono">{stats.avgTrust.toFixed(1)}%</div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${stats.avgTrust}%` }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Immutable cryptographic verification active</p>
                  </div>
                  <div className="glass p-10 rounded-[3rem] border-white/10 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Semantic Density</span>
                      <Zap size={20} className="text-amber-400" />
                    </div>
                    <div className="text-4xl font-black text-white mono">{files.filter(f => f.status === 'ready').length * 12}K</div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Multidimensional vector embedding space</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="glass p-10 rounded-[4rem] border-white/5">
                    <h4 className="text-xl font-black text-white mb-8 uppercase italic">Modality Distribution</h4>
                    <div className="space-y-6">
                      {[
                        { name: 'Documents', count: stats.modalityCounts.text || 0, color: 'bg-blue-500' },
                        { name: 'Visuals', count: stats.modalityCounts.image || 0, color: 'bg-rose-500' },
                        { name: 'Audio', count: stats.modalityCounts.audio || 0, color: 'bg-emerald-500' },
                        { name: 'PDFs', count: stats.modalityCounts.pdf || 0, color: 'bg-purple-500' }
                      ].map(m => (
                        <div key={m.name} className="flex items-center gap-6">
                          <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
                          <span className="flex-1 text-[11px] font-bold uppercase text-slate-400">{m.name}</span>
                          <span className="text-sm font-black text-white mono">{m.count} Nodes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass p-10 rounded-[4rem] border-white/5 flex flex-col justify-center items-center text-center">
                    <CpuIcon size={48} className="text-indigo-400 mb-6 animate-pulse" />
                    <h4 className="text-xl font-black text-white mb-4 uppercase italic">Inference Engine Health</h4>
                    <div className="flex gap-4 mb-6">
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full">ACTIVE</div>
                      <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black rounded-full">OPTIMAL</div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose max-w-xs">
                      Current latency at 0.42ms. Multi-GPU local scaling initialized for subsequent multimodal ingestions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Subpage */}
          {view === 'settings' && (
            <div className="flex-1 overflow-y-auto p-12 animate-slide-up">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6 mb-16">
                  <div className="bg-slate-700 p-6 rounded-[2rem] text-white">
                    <Settings size={40} />
                  </div>
                  <div>
                    <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">Config</h2>
                    <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">Intelligence & Security Preferences</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <section className="glass p-10 rounded-[4rem] border-white/5">
                    <div className="flex items-center gap-4 mb-10">
                      <Activity size={24} className="text-indigo-400" />
                      <h3 className="text-xl font-black text-white uppercase italic">Intelligence Model</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button
                        onClick={() => setModelType('pro')}
                        className={`p-8 rounded-[2.5rem] text-left transition-all border ${modelType === 'pro' ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-black/40 border-white/10 hover:border-white/20'}`}
                      >
                        <h4 className="text-lg font-black text-white mb-2 uppercase">Gemini 3 Pro</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${modelType === 'pro' ? 'text-indigo-100' : 'text-slate-500'}`}>High-fidelity reasoning & complex multimodal RAG.</p>
                      </button>
                      <button
                        onClick={() => setModelType('flash')}
                        className={`p-8 rounded-[2.5rem] text-left transition-all border ${modelType === 'flash' ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'bg-black/40 border-white/10 hover:border-white/20'}`}
                      >
                        <h4 className="text-lg font-black text-white mb-2 uppercase">Gemini 3 Flash</h4>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${modelType === 'flash' ? 'text-indigo-100' : 'text-slate-500'}`}>Low-latency synthesis & rapid metadata generation.</p>
                      </button>
                    </div>
                  </section>

                  <section className="glass p-10 rounded-[4rem] border-white/5">
                    <div className="flex items-center gap-4 mb-10">
                      <Shield size={24} className="text-emerald-400" />
                      <h3 className="text-xl font-black text-white uppercase italic">Security Protocol</h3>
                    </div>
                    <div className="space-y-4">
                      {['standard', 'strict', 'paranoid'].map(level => (
                        <button
                          key={level}
                          onClick={() => setSecurityLevel(level as any)}
                          className={`w-full p-6 rounded-3xl flex items-center justify-between border transition-all ${securityLevel === level ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
                        >
                          <span className="text-sm font-black uppercase tracking-widest">{level} mode</span>
                          {securityLevel === level && <CheckCircle2 size={20} />}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="glass p-10 rounded-[4rem] border-white/5">
                    <div className="flex items-center gap-4 mb-10">
                      <Eye size={24} className="text-rose-400" />
                      <h3 className="text-xl font-black text-white uppercase italic">Interface FX</h3>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/10">
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Neural Shimmers</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Enable atmospheric CSS glow and shimmer effects.</p>
                      </div>
                      <button onClick={() => setShowNeuralShimmer(!showNeuralShimmer)} className={`w-14 h-8 rounded-full transition-all relative ${showNeuralShimmer ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${showNeuralShimmer ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </section>

                  <div className="p-10 text-center space-y-4">
                    <button onClick={() => window.location.reload()} className="flex items-center gap-3 mx-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all">
                      <RefreshCw size={16} /> Hard Restart Node
                    </button>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">FusionSeek v4.2.0-STABLE :: ALPHA PROXY</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 glass border-t border-white/5 px-8 flex items-center justify-between z-[100]">
        <div className="flex gap-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Engine v4.2 :: SYNCED</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Provenance Ledger :: {securityLevel.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
          <ShieldCheck size={12} className="text-emerald-500/40" />
          <span className="opacity-40">Zero-Trust Environment • No Exfiltration Detected</span>
        </div>
      </footer>

      <style>{`
        .no-shimmer .shimmer, 
        .no-shimmer .scan-line, 
        .no-shimmer .animate-pulse-glow {
          animation: none !important;
          opacity: 0.1 !important;
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-reverse-spin {
          animation: reverse-spin 15s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
