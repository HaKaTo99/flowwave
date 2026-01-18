import { DragEvent, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { NodeIcon } from './NodeIcon';
import { useCases } from './CanvasEmptyState';

interface NodeDef {
    type: string;
    label: string;
    icon: string;
    color: string;
    premium?: boolean;
}

interface NodeCategory {
    name: string;
    icon: string;
    nodes: NodeDef[];
}

const nodeCategories: NodeCategory[] = [
    {
        name: '⚡ Triggers',
        icon: '⚡',
        nodes: [
            { type: 'schedule', label: 'Schedule', icon: '📅', color: 'from-amber-500 to-orange-500' },
            { type: 'cron-trigger', label: 'Cron', icon: '⏰', color: 'from-orange-500 to-red-500' },
            { type: 'interval-trigger', label: 'Interval', icon: '🔄', color: 'from-yellow-500 to-amber-500' },
            { type: 'webhook', label: 'Webhook', icon: '🔗', color: 'from-indigo-500 to-purple-500' },
        ]
    },
    {
        name: '🤖 AI & Agents',
        icon: '🤖',
        nodes: [
            { type: 'ai-agent', label: 'AI Agent', icon: '🤖', color: 'from-violet-500 to-purple-600' },
            { type: 'openai-chat', label: 'OpenAI', icon: '⚡', color: 'from-emerald-500 to-green-500' },
            { type: 'anthropic-chat', label: 'Claude', icon: '🧠', color: 'from-orange-500 to-amber-500' },
            { type: 'gemini-chat', label: 'Gemini', icon: '✨', color: 'from-blue-500 to-cyan-500' },
            { type: 'text-to-workflow', label: 'AI Builder', icon: '🪄', color: 'from-purple-500 to-pink-500', premium: true },
        ]
    },
    {
        name: '🧠 Memory',
        icon: '🧠',
        nodes: [
            { type: 'buffer-memory', label: 'Buffer Memory', icon: '💾', color: 'from-pink-500 to-rose-500' },
            { type: 'simple-memory', label: 'Simple Memory', icon: '📝', color: 'from-rose-500 to-red-500' },
        ]
    },
    {
        name: '📚 RAG & Vector',
        icon: '📚',
        nodes: [
            { type: 'embeddings', label: 'Embeddings', icon: '🔤', color: 'from-cyan-500 to-blue-500' },
            { type: 'text-splitter', label: 'Text Splitter', icon: '✂️', color: 'from-teal-500 to-cyan-500' },
            { type: 'pinecone', label: 'Pinecone', icon: '🌲', color: 'from-emerald-500 to-teal-500' },
            { type: 'rag-query', label: 'RAG Query', icon: '🔍', color: 'from-lime-500 to-green-500' },
        ]
    },
    {
        name: '🔧 Core',
        icon: '🔧',
        nodes: [
            { type: 'http-request', label: 'HTTP Request', icon: '🌐', color: 'from-purple-500 to-indigo-500' },
            { type: 'delay', label: 'Delay', icon: '⏱️', color: 'from-amber-500 to-yellow-500' },
            { type: 'condition', label: 'Condition', icon: '⑂', color: 'from-blue-500 to-indigo-500' },
            { type: 'debug', label: 'Debug', icon: '🐛', color: 'from-gray-500 to-slate-500' },
        ]
    },
    {
        name: '⚙️ Utilities',
        icon: '⚙️',
        nodes: [
            { type: 'loop-items', label: 'Loop Items', icon: '🔄', color: 'from-cyan-400 to-blue-500' },
            { type: 'code', label: 'Code', icon: '{ }', color: 'from-slate-500 to-gray-600' },
            { type: 'switch', label: 'Switch', icon: '⑂', color: 'from-gray-500 to-slate-600' },
            { type: 'edit-fields', label: 'Edit Fields', icon: '✏️', color: 'from-teal-400 to-emerald-500' },
            { type: 'structured-output', label: 'Parser', icon: '📊', color: 'from-lime-400 to-green-500' },
        ]
    },
    {
        name: '💬 Communication',
        icon: '💬',
        nodes: [
            { type: 'email', label: 'Email', icon: '📧', color: 'from-red-500 to-rose-500' },
            { type: 'telegram', label: 'Telegram', icon: '✈️', color: 'from-sky-400 to-blue-500' },
            { type: 'discord', label: 'Discord', icon: '🎮', color: 'from-indigo-500 to-violet-600' },
            { type: 'slack', label: 'Slack', icon: '💬', color: 'from-purple-500 to-fuchsia-500' },
            { type: 'whatsapp', label: 'WhatsApp', icon: '📞', color: 'from-green-500 to-emerald-600' },
        ]
    },
    {
        name: '🗄️ Database',
        icon: '🗄️',
        nodes: [
            { type: 'postgres', label: 'Postgres', icon: '🐘', color: 'from-blue-500 to-indigo-600' },
            { type: 'mysql', label: 'MySQL', icon: '🐬', color: 'from-orange-400 to-amber-500' },
            { type: 'mongodb', label: 'MongoDB', icon: '🍃', color: 'from-green-500 to-emerald-600' },
            { type: 'supabase', label: 'Supabase', icon: '⚡', color: 'from-emerald-400 to-green-500' },
        ]
    },
    {
        name: '📱 Apps',
        icon: '📱',
        nodes: [
            { type: 'google-sheets', label: 'Sheets', icon: '📊', color: 'from-green-500 to-emerald-500' },
            { type: 'google-docs', label: 'Docs', icon: '📝', color: 'from-blue-500 to-indigo-500' },
            { type: 'google-drive', label: 'Drive', icon: '📁', color: 'from-yellow-500 to-amber-500' },
            { type: 'google-calendar', label: 'Calendar', icon: '📅', color: 'from-blue-400 to-cyan-500' },
            { type: 'notion', label: 'Notion', icon: '📝', color: 'from-slate-500 to-gray-600' },
            { type: 'jira', label: 'Jira', icon: '🎫', color: 'from-blue-600 to-indigo-700' },
            { type: 'trello', label: 'Trello', icon: '📋', color: 'from-blue-400 to-indigo-500' },
            { type: 'github', label: 'GitHub', icon: '🐙', color: 'from-gray-600 to-slate-700' },
        ]
    },
    {
        name: '📢 Social Media',
        icon: '📢',
        nodes: [
            { type: 'twitter', label: 'Twitter (X)', icon: '✖️', color: 'from-slate-700 to-black' },
            { type: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-cyan-700' },
            { type: 'tiktok', label: 'TikTok', icon: '🎵', color: 'from-black to-pink-500' },
            { type: 'facebook', label: 'Facebook', icon: '📘', color: 'from-blue-500 to-blue-700' },
            { type: 'instagram', label: 'Instagram', icon: '📸', color: 'from-purple-500 to-pink-500' },
        ]
    }
];

const totalNodes = nodeCategories.reduce((acc, cat) => acc + cat.nodes.length, 0);

const Sidebar = ({ onUseTemplate }: { onUseTemplate?: (template: string) => void }) => {
    const { isDark } = useTheme();
    const [expandedCategories, setExpandedCategories] = useState<string[]>([
        '🤖 AI & Agents',
        '🔧 Core'
    ]);
    const [searchTerm, setSearchTerm] = useState('');

    const onDragStart = (event: DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const toggleCategory = (categoryName: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryName)
                ? prev.filter(c => c !== categoryName)
                : [...prev, categoryName]
        );
    };

    const filteredCategories = nodeCategories.map(category => ({
        ...category,
        nodes: category.nodes.filter(node =>
            node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.type.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(category => category.nodes.length > 0);

    return (
        <div className={`w-72 h-full backdrop-blur-xl border-r flex flex-col shadow-2xl z-10 transition-colors
            ${isDark
                ? 'bg-[#0f0f1a]/90 border-white/10'
                : 'bg-white/95 border-slate-200'
            }`}>
            {/* Header with Gradient */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                <div className="text-2xl font-bold flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">
                        🌊
                    </div>
                    <div>
                        <div className="text-xl font-bold">FlowWave</div>
                        <div className="text-xs text-white/70 font-normal">AI Workflow Automation</div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <div className="relative group">
                    <input
                        type="text"
                        placeholder="Search nodes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl transition-all duration-300
                            focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                            ${isDark
                                ? 'bg-white/5 border border-white/10 text-white placeholder-white/40'
                                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500'
                            }`}
                    />
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${isDark ? 'text-white/40' : 'text-slate-400'}`}>🔍</span>
                </div>
            </div>

            {/* Node Categories */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Templates Section */}
                <div className="animate-fade-in-up">
                    <button
                        onClick={() => toggleCategory('📂 Templates')}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold rounded-xl flex items-center justify-between transition-all duration-200 group
                                ${isDark
                                ? 'text-white/80 hover:bg-white/5'
                                : 'text-slate-900 hover:bg-slate-100'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            📂 Templates
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'text-white/40 bg-white/5' : 'text-slate-500 bg-slate-100'}`}>
                                {useCases.length}
                            </span>
                            <span className={`text-xs transition-transform duration-200 ${isDark ? 'text-white/40' : 'text-slate-400'}
                                              ${expandedCategories.includes('📂 Templates') ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </div>
                    </button>

                    {/* Template Items */}
                    {expandedCategories.includes('📂 Templates') && (
                        <div className="pl-2 mt-2 space-y-1.5">
                            {useCases.map((template, idx) => (
                                <div
                                    key={template.title}
                                    onClick={() => onUseTemplate?.(template.action)}
                                    className={`
                                            p-3 rounded-xl cursor-pointer transition-all duration-300
                                            border hover:scale-[1.02] active:scale-[0.98]
                                        group relative overflow-hidden p-3 rounded-lg border cursor-pointer transition-all duration-200
                                        hover:shadow-md hover:scale-[1.02]
                                        ${isDark
                                            ? 'bg-[#1e1e2d] border-white/5 hover:border-indigo-500/50'
                                            : 'bg-white border-slate-100 hover:border-indigo-200'
                                        }
                                    `}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${template.color}`}></div>
                                    <div className="flex items-start gap-3 pl-2">
                                        <span className="text-xl mt-0.5">{template.icon}</span>
                                        <div>
                                            <div className={`text-xs font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                                {template.title}
                                            </div>
                                            <div className={`text-[10px] leading-tight line-clamp-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                                                {template.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Node Categories */}
                {filteredCategories.map((category) => (
                    <div key={category.name} className="mb-1">
                        <button
                            onClick={() => toggleCategory(category.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200
                                ${expandedCategories.includes(category.name)
                                    ? isDark ? 'bg-white/5 text-white' : 'bg-slate-50 text-slate-800'
                                    : isDark ? 'text-white/60 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                <span>{category.icon}</span> {category.name}
                            </div>
                            <span className={`text-xs opacity-50 transition-transform duration-200 ${expandedCategories.includes(category.name) ? 'rotate-90' : ''}`}>
                                ▶
                            </span>
                        </button>

                        {expandedCategories.includes(category.name) && (
                            <div className="grid grid-cols-1 gap-1.5 mt-1.5 px-2 pb-2">
                                {category.nodes.map((node) => (
                                    <div
                                        key={node.type}
                                        onDragStart={(event) => onDragStart(event, node.type)}
                                        draggable
                                        className={`
                                            flex items-center gap-3 p-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-all duration-200
                                            hover:shadow-sm hover:translate-x-1
                                            ${isDark
                                                ? 'bg-[#0f0f1a] border-white/5 hover:bg-[#1e1e2d] hover:border-white/10 text-white/90'
                                                : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-inner
                                            bg-gradient-to-br ${node.color} text-white
                                        `}>
                                            <NodeIcon type={node.type} className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold">{node.label}</span>
                                        </div>
                                        {node.premium && (
                                            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-bold">
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                        <span className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                            {totalNodes} nodes
                        </span>
                    </div>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                        <span>Support</span>
                        <span>❤️</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
