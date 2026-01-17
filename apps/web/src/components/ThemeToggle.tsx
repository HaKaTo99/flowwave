import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative w-14 h-7 rounded-full transition-all duration-300
                ${isDark
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30'
                    : 'bg-amber-400 shadow-lg shadow-amber-400/30'
                }
            `}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {/* Track icons */}
            <div className="absolute inset-0 flex items-center justify-between px-1.5">
                <span className={`text-xs transition-opacity ${isDark ? 'opacity-100' : 'opacity-30'}`}>
                    🌙
                </span>
                <span className={`text-xs transition-opacity ${isDark ? 'opacity-30' : 'opacity-100'}`}>
                    ☀️
                </span>
            </div>

            {/* Toggle ball */}
            <div
                className={`
                    absolute top-0.5 w-6 h-6 rounded-full 
                    bg-white shadow-md
                    transition-all duration-300 ease-in-out
                    ${isDark ? 'left-0.5' : 'left-[calc(100%-26px)]'}
                `}
            />
        </button>
    );
};

export default ThemeToggle;
