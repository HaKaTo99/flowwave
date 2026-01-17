import React from 'react';
import { useTheme } from '../context/ThemeContext';

const SyncToggle: React.FC<{ mode: string, setMode: (m: any) => void }> = ({ mode, setMode }) => {
    const { isDark } = useTheme();

    const modeConfig: Record<string, { icon: string; label: string; color: string; bg: string; lightColor: string; lightBg: string }> = {
        offline: {
            icon: '🔒',
            label: 'Offline',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            lightColor: 'text-emerald-700',
            lightBg: 'bg-emerald-50'
        },
        online: {
            icon: '☁️',
            label: 'Online',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            lightColor: 'text-blue-700',
            lightBg: 'bg-blue-50'
        },
        hybrid: {
            icon: '🔄',
            label: 'Hybrid',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            lightColor: 'text-purple-700',
            lightBg: 'bg-purple-50'
        }
    };

    const current = modeConfig[mode] || modeConfig.offline;
    const activeColor = isDark ? current.color : current.lightColor;
    const activeBg = isDark ? current.bg : current.lightBg;
    const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
    const optionBg = isDark ? 'bg-[#1a1a2e] text-white' : 'bg-white text-slate-800';

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${activeBg} border ${borderColor} transition-colors`}>
            <span className="text-sm">{current.icon}</span>
            <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className={`bg-transparent text-sm font-medium ${activeColor} focus:outline-none cursor-pointer appearance-none pr-5`}
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${isDark ? '%2394a3b8' : '%23475569'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0 center',
                    backgroundSize: '14px'
                }}
            >
                <option value="offline" className={optionBg}>Offline (Privacy)</option>
                <option value="online" className={optionBg}>Online (Cloud)</option>
                <option value="hybrid" className={optionBg}>Hybrid</option>
            </select>
        </div>
    );
};

export default SyncToggle;
