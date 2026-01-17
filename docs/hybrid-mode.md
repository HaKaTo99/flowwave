# Hybrid Mode Guide

WaveforAI supports three modes of operation:

1. **Offline (Default)**
   - All data stored locally in SQLite (`flowwave.db`).
   - No internet connection required.
   - Ideal for high-privacy or air-gapped environments.

2. **Online**
   - Data synced to a cloud PostgreSQL database.
   - Enables AI features and remote access.

3. **Hybrid**
   - Works offline and syncs changes when connectivity is restored.

## Sync Process
- Changes are tracked in a `SyncQueue`.
- `SyncManager` handles pushing/pulling data.
- Conflicts are resolved via timestamp or manual user intervention.

## Switch Mode
Use the **SyncToggle** in the application settings to switch modes.
