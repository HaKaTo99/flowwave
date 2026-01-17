import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export const useYjs = (docName: string) => {
    const [doc] = useState(() => new Y.Doc());
    const [provider, setProvider] = useState<WebsocketProvider | null>(null);
    const [persisted, setPersisted] = useState(false);

    useEffect(() => {
        // 1. Setup Offline Persistence (IndexedDB)
        const persistence = new IndexeddbPersistence(docName, doc);
        persistence.on('synced', () => {
            console.log('[Yjs] Content loaded from IndexedDB');
            setPersisted(true);
        });

        // 2. Setup Online Sync (WebSocket)
        // Adjust URL to point to backend. 
        // In dev: ws://localhost:3001 (backend port)
        const wsProvider = new WebsocketProvider(
            'ws://localhost:3001',
            docName,
            doc
        );

        wsProvider.on('status', (event: any) => {
            console.log('[Yjs] WS Status:', event.status);
        });

        setProvider(wsProvider);

        return () => {
            wsProvider.destroy();
            persistence.destroy();
        };
    }, [doc, docName]);

    return { doc, provider, persisted };
};
