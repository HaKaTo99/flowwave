import { useTheme } from '../context/ThemeContext';

interface ToolbarProps {
    onSave: () => void;
    onRun: () => void;
    onOpen?: () => void;
    onHistory?: () => void;
    saving?: boolean;
    running?: boolean;
}

const Toolbar = ({ onSave, onRun, onOpen, onHistory, saving = false, running = false }: ToolbarProps) => {
    const { isDark } = useTheme();

    const buttonClass = `px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 
        focus:ring-2 focus:ring-indigo-500/50 focus:outline-none flex items-center gap-2
        ${isDark
            ? 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
            : 'bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
        }`;

    return (
        <div className="flex items-center gap-3">
            {onOpen && (
                <button
                    onClick={onOpen}
                    className={buttonClass}
                >
                    <span className="text-base">📂</span>
                    Open
                </button>
            )}
            <button
                onClick={onSave}
                disabled={saving}
                className={`${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {saving ? (
                    <>
                        <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-white/30 border-t-white' : 'border-slate-300 border-t-slate-600'}`}></div>
                        <span>Saving...</span>
                    </>
                ) : (
                    <>
                        <span className="text-base">💾</span>
                        Save
                    </>
                )}
            </button>
            <button
                onClick={onRun}
                disabled={running}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                           text-white rounded-xl font-semibold text-sm 
                           shadow-lg shadow-indigo-500/30 
                           hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02]
                           transition-all duration-200 
                           focus:ring-2 focus:ring-indigo-400 focus:outline-none 
                           flex items-center gap-2 
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
                {running ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Running...</span>
                    </>
                ) : (
                    <>
                        <span className="text-lg">▶</span>
                        Run Workflow
                    </>
                )}
            </button>
            {onHistory && (
                <button
                    onClick={onHistory}
                    className={buttonClass}
                >
                    <span className="text-base">📊</span>
                    History
                </button>
            )}
        </div>
    );
};

export default Toolbar;
