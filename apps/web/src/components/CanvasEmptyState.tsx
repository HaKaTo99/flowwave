import { useTheme } from '../context/ThemeContext';

interface UseCase {
    title: string;
    description: string;
    icon: string;
    color: string;
    action: string;
}

export const useCases: UseCase[] = [
    {
        title: 'IT Ops can',
        description: 'On-board new employees automatically',
        icon: '⚡',
        color: 'from-purple-500 to-indigo-600',
        action: 'On-board new employees'
    },
    {
        title: 'Sec Ops can',
        description: 'Enrich security incident tickets',
        icon: '🛡️',
        color: 'from-orange-500 to-red-600',
        action: 'Enrich tickets'
    },
    {
        title: 'Dev Ops can',
        description: 'Convert natural language into API calls',
        icon: '🛠️',
        color: 'from-blue-500 to-cyan-500',
        action: 'Convert natural language'
    },
    {
        title: 'Sales can',
        description: 'Generate customer insights from reviews',
        icon: '📈',
        color: 'from-emerald-500 to-green-600',
        action: 'Generate customer insights'
    },
    {
        title: 'HR can',
        description: 'Screen resumes & schedule interviews',
        icon: '👥',
        color: 'from-pink-500 to-rose-500',
        action: 'Screening: Candidate'
    },
    {
        title: 'Marketing can',
        description: 'Create & post viral tweets automatically',
        icon: '🚀',
        color: 'from-amber-400 to-orange-500',
        action: 'Tweet: Viral Content'
    },
    {
        title: 'Support can',
        description: 'Classify & auto-reply to urgency tickets',
        icon: '🎧',
        color: 'from-cyan-400 to-blue-500',
        action: 'Support: Auto-Response'
    },
    {
        title: 'Finance can',
        description: 'Process expense approvals via OCR',
        icon: '💳',
        color: 'from-violet-500 to-purple-600',
        action: 'Expense: Approval'
    },
    {
        title: 'Legal can',
        description: 'Analyze PDF contracts for high-risk clauses',
        icon: '⚖️',
        color: 'from-slate-600 to-stone-700',
        action: 'Legal: Contract Review'
    },
    {
        title: 'Analyst can',
        description: 'Convert plain English details to SQL queries',
        icon: '💾',
        color: 'from-blue-600 to-indigo-700',
        action: 'Data: Text-to-SQL'
    },
    {
        title: 'Researcher can',
        description: 'Summarize arXiv papers & save to Notion',
        icon: '🎓',
        color: 'from-teal-500 to-emerald-600',
        action: 'Research: Paper Summarizer'
    },
    {
        title: 'Inventory can',
        description: 'Monitor Excel stock levels & auto-order',
        icon: '📊',
        color: 'from-lime-500 to-green-600',
        action: 'Inventory: Stock Alert'
    },
    {
        title: 'Comms can',
        description: 'Send WhatsApp announcements to all employees',
        icon: '📢',
        color: 'from-green-500 to-emerald-600',
        action: 'Comms: WhatsApp Blast'
    },
    {
        title: 'Social can',
        description: 'Cross-post content to TikTok & Instagram',
        icon: '📱',
        color: 'from-purple-500 to-pink-500',
        action: 'Social: Cross-Post'
    },
    {
        title: 'Trader can',
        description: 'Analyze stocks via Telegram voice notes',
        icon: '📈',
        color: 'from-blue-600 to-cyan-500',
        action: 'Trader: Stock Analysis'
    }
];

export const CanvasEmptyState = ({
    onOpenTemplates,
    onUseTemplate
}: {
    onOpenTemplates: () => void;
    onUseTemplate: (template: string) => void;
}) => {
    const { isDark } = useTheme();

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-12 animate-fade-in">

            {/* Top Section: Use Case Cards */}
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pointer-events-auto z-50 relative">
                {useCases.map((useCase, idx) => (
                    <div
                        key={idx}
                        onClick={() => {
                            // alert(`Loading template: ${useCase.action}`); // Feedback for user
                            onUseTemplate(useCase.action);
                        }}
                        className={`
                            group relative p-6 rounded-2xl cursor-pointer transition-all duration-500
                            border hover:scale-[1.03] hover:-translate-y-2 active:scale-[0.98] overflow-hidden
                            ${isDark
                                ? 'bg-[#1a1a2e]/90 border-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-indigo-500/20'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10'
                            }
                        `}
                    >
                        <div className={`
                            absolute inset-0 bg-gradient-to-br ${useCase.color}
                            opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none
                        `}></div>

                        <div className={`
                            absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${useCase.color}
                            opacity-70 group-hover:opacity-100 transition-all duration-300
                        `}></div>

                        <div className="flex flex-col h-full justify-between gap-4">
                            <div>
                                <h3 className={`text-lg font-bold mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    {useCase.title.replace(' can', '')} <span className={`text-sm font-normal ${isDark ? 'text-white/50' : 'text-slate-500'}`}>can</span>
                                </h3>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                    <span className="mr-2 inline-block transition-transform group-hover:scale-110">{useCase.icon}</span>
                                    {useCase.description}
                                </p>
                            </div>

                            <div className={`
                                text-xs font-semibold uppercase tracking-wider flex items-center gap-1
                                bg-gradient-to-r ${useCase.color} bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0
                            `}>
                                Try Template <span>→</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subtle Browse Link */}
            <div className="mt-12 pointer-events-auto opacity-0 animate-fade-in delay-200 text-center" style={{ animationFillMode: 'forwards' }}>
                <button
                    onClick={onOpenTemplates}
                    className={`text-sm font-medium hover:underline transition-colors ${isDark ? 'text-white/40 hover:text-white/80' : 'text-slate-400 hover:text-slate-700'}`}
                >
                    or browse all templates
                </button>
            </div>
        </div>
    );
};
