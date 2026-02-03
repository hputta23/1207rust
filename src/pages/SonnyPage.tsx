import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Terminal, Loader2, Sparkles, AlertCircle, Trash2, Settings, Key, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CyberCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={`relative bg-[#050505] border-2 border-[#FCEE0A] clip-corner-1 ${className}`}>
        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00F0FF] z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00F0FF] z-20 pointer-events-none"></div>
        {children}
    </div>
);

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    thinking?: string[];
}

const SUGGESTIONS = [
    { label: "ANALYZE AAPL", prompt: "Analyze AAPL stock performance" },
    { label: "BACKTEST TSLA", prompt: "Backtest TSLA with SMA Crossover" },
    { label: "SIMULATE NVDA", prompt: "Simulate NVDA price for next 30 days" },
    { label: "COMPARE TECH", prompt: "Compare MSFT and GOOGL fundamentals" },
];

export default function SonnyPage() {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // --- Handlers ---
    const handleSend = async (text: string = input) => {
        const prompt = text.trim();
        if (!prompt || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/agent/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content }),
            });

            if (!response.ok) throw new Error('Agent Connection Failed');

            const data = await response.json();

            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: Date.now(),
                thinking: data.thinking_steps
            };

            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: "⚠️ **SYSTEM FAILURE**: NEURAL LINK SEVERED. CHECK PORT 8000.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => setMessages([]);

    return (
        <div className="flex-1 min-h-0 flex flex-col p-4 md:p-6 w-full max-w-7xl mx-auto relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[#050505] -z-20"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] -z-10 opacity-50"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(252,238,10,0.05)_0%,transparent_50%)] -z-10"></div>

            {/* Header */}
            <div className="mb-6 flex items-center justify-between shrink-0 border-b border-[#FCEE0A]/30 pb-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#FCEE0A] clip-corner-2 shadow-[0_0_15px_rgba(252,238,10,0.4)]">
                        <Bot className="w-8 h-8 text-black" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tighter text-[#FCEE0A] glitch-text" data-text="SONNY">
                            SONNY
                        </h1>
                        <p className="text-[#00F0FF] text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#39FF14] animate-pulse shadow-[0_0_8px_#39FF14]"></span>
                            NETRUNNER V.2.0.77
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={clearChat}
                        className="p-2 border border-[#FF003C]/50 text-[#FF003C] hover:bg-[#FF003C]/20 hover:text-[#FF003C] transition-all clip-corner-2 backdrop-blur-md"
                        title="PURGE MEMORY"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 border border-[#00F0FF]/50 text-[#00F0FF] hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] transition-all clip-corner-2 backdrop-blur-md"
                        title="SYSTEM CONFIG"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <CyberCard className="flex-1 flex flex-col min-h-0 relative w-full mb-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] !bg-black/40 backdrop-blur-md border border-[#FCEE0A]/30">

                {/* Messages Area */}
                <div className={`flex-1 overflow-y-auto p-4 md:p-6 z-10 scrollbar-thin scrollbar-thumb-[#FCEE0A]/50 scrollbar-track-transparent ${messages.length === 0 ? 'flex flex-col items-center justify-center' : 'space-y-8'}`}>

                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                            <div className="w-24 h-24 border-2 border-[#FCEE0A] flex items-center justify-center mb-8 bg-[#FCEE0A]/10 clip-corner-both relative">
                                <Sparkles className="w-12 h-12 text-[#FCEE0A]" />
                                <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                            </div>
                            <h2 className="text-xl md:text-3xl font-black text-white mb-3 tracking-tight uppercase">
                                INITIALIZE <span className="text-[#FCEE0A]">TRADING PROTOCOL</span>
                            </h2>
                            <p className="text-[#00F0FF] font-mono max-w-xl mb-10 text-xs md:text-sm border-l-2 border-[#00F0FF] pl-4">
                                // SYSTEM READY<br />
                                // AWAITING INPUT...
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                                {SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s.prompt)}
                                        className="text-left px-5 py-3 bg-[#111] border border-[#333] hover:border-[#FCEE0A] hover:bg-[#FCEE0A] group transition-all clip-corner-2 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-[#FCEE0A]/0 group-hover:bg-[#FCEE0A] transition-colors duration-300 z-0"></div>
                                        <span className="relative z-10 text-[#FCEE0A] group-hover:text-black text-xs font-bold block mb-1 tracking-widest">
                                            {s.label}
                                        </span>
                                        <span className="relative z-10 text-gray-500 group-hover:text-black/70 text-[10px] font-mono block">
                                            {s.prompt} {'>>'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>

                                {/* Avatar */}
                                <div className={`w-10 h-10 flex items-center justify-center shrink-0 border-2
                                    ${msg.role === 'user'
                                        ? 'bg-[#00F0FF] border-[#00F0FF] clip-corner-2'
                                        : msg.role === 'system'
                                            ? 'bg-[#FF003C] border-[#FF003C] clip-corner-1'
                                            : 'bg-[#FCEE0A] border-[#FCEE0A] clip-corner-1'}`}>
                                    {msg.role === 'user' ? <User size={20} className="text-black" /> :
                                        msg.role === 'system' ? <AlertCircle size={20} className="text-black" /> : <Bot size={20} className="text-black" />}
                                </div>

                                {/* Content */}
                                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                    {/* Thinking Steps */}
                                    {msg.thinking && msg.thinking.length > 0 && (
                                        <div className="mb-3 space-y-1.5 w-full bg-black/50 backdrop-blur-sm border-l-2 border-[#39FF14] p-3 rounded-r-lg">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[#39FF14] uppercase tracking-widest mb-2">
                                                <Terminal size={12} />
                                                PROCESSING...
                                            </div>
                                            {msg.thinking.map((step, idx) => (
                                                <div key={idx} className="flex items-start gap-2 text-xs text-[#39FF14]/80 font-mono">
                                                    <span className="opacity-50">{'>>'}</span>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div className={`px-6 py-4 relative group backdrop-blur-md shadow-lg ${msg.role === 'user'
                                        ? 'bg-[#00F0FF]/10 border border-[#00F0FF] text-[#00F0FF] clip-corner-1'
                                        : msg.role === 'system'
                                            ? 'bg-[#FF003C]/10 border border-[#FF003C] text-[#FF003C] clip-corner-2'
                                            : 'bg-black/60 border-l-4 border-[#FCEE0A] text-gray-200 clip-corner-2'
                                        }`}>

                                        {msg.role === 'assistant' || msg.role === 'system' ? (
                                            <div className="prose prose-invert prose-sm max-w-none font-mono">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap leading-relaxed font-bold tracking-wide">{msg.content}</p>
                                        )}
                                    </div>

                                    <span className="text-[10px] text-gray-600 mt-2 px-1 font-mono uppercase tracking-widest">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex gap-4 animate-in fade-in duration-300">
                            <div className="w-10 h-10 bg-[#FCEE0A]/20 border border-[#FCEE0A] flex items-center justify-center shrink-0 clip-corner-1">
                                <Bot size={20} className="text-[#FCEE0A] animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3 text-[#FCEE0A] text-xs font-mono bg-[#FCEE0A]/5 px-4 py-3 border border-[#FCEE0A]/30 clip-corner-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="animate-pulse">COMPUTING OPTIMAL STRATEGY...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-[#FCEE0A]/20 bg-black/60 backdrop-blur-xl relative z-20">
                    <div className="relative flex gap-3 max-w-4xl mx-auto w-full">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="ENTER COMMAND..."
                            disabled={isLoading}
                            className="flex-1 min-w-0 bg-[#111] border-2 border-[#333] text-[#FCEE0A] px-6 py-4 focus:outline-none focus:border-[#FCEE0A] focus:shadow-[0_0_15px_rgba(252,238,10,0.3)] transition-all placeholder:text-gray-700 disabled:opacity-50 font-mono tracking-wider clip-corner-1"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            className="shrink-0 bg-[#FCEE0A] hover:bg-[#fff700] disabled:opacity-50 disabled:cursor-not-allowed text-black px-8 font-black uppercase tracking-widest clip-corner-2 flex items-center gap-2 transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0_#00F0FF]"
                        >
                            <Send size={18} strokeWidth={3} />
                            <span className="hidden sm:inline">EXECUTE</span>
                        </button>
                    </div>
                </div>
            </CyberCard>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#050505] border-2 border-[#00F0FF] w-full max-w-md p-1 relative shadow-[0_0_50px_rgba(0,240,255,0.2)] clip-corner-both">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="absolute top-4 right-4 text-[#00F0FF] hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6 bg-[#111] clip-corner-both h-full">
                            <div className="flex items-center gap-3 mb-8 border-b border-[#00F0FF]/30 pb-4">
                                <div className="p-2 bg-[#00F0FF] text-black">
                                    <Key className="w-5 h-5" strokeWidth={3} />
                                </div>
                                <h2 className="text-xl font-black text-[#00F0FF] uppercase tracking-widest">System Config</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-black border border-[#333]">
                                    <h3 className="text-xs font-bold text-[#FCEE0A] uppercase mb-2">API Key Injection</h3>
                                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed mb-3">
                                        // WARNING: AUTHORIZED PERSONNEL ONLY<br />
                                        Set your neural keys in the backend environment.
                                    </p>
                                    <div className="bg-[#050505] p-3 border border-[#333] font-mono text-[10px] text-gray-500 overflow-x-auto">
                                        <p># rust_server/.env</p>
                                        <p><span className="text-[#00F0FF]">OPENAI_API_KEY</span>=sk-...</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-black border border-[#333]">
                                    <h3 className="text-xs font-bold text-[#FCEE0A] uppercase mb-2">System Status</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#39FF14] animate-pulse"></span>
                                        <span className="text-xs text-[#39FF14] font-mono">ONLINE // STATISTICAL ENGINE ACTIVE</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="px-6 py-2 border border-[#00F0FF] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Terminate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
