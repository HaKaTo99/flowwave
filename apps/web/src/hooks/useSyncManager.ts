import { useState, useEffect } from 'react';

export const useSyncManager = () => {
    const [mode, setMode] = useState<'offline' | 'online' | 'hybrid'>('offline');
    const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('offline');

    const switchMode = (newMode: 'offline' | 'online' | 'hybrid') => {
        setMode(newMode);
        console.log('Switched to mode:', newMode);
        // TODO: Connect to backend SyncManager
        if (newMode === 'offline') {
            setSyncStatus('offline');
        } else {
            setSyncStatus('synced'); // Mock
        }
    };

    return { mode, switchMode, syncStatus };
};
