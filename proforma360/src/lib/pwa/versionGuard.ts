import { SCHEMA_VERSION } from '@/config/appVersion';

export type VersionStatus = 'VALID' | 'DOWNGRADE_DETECTED' | 'MIGRATION_FAILED';

export const runBootValidation = (): VersionStatus => {
  if (typeof window === 'undefined') return 'VALID';
  
  try {
    // 1. Storage Pressure Check (Async, non-blocking)
    import('./storageManager').then((m) => m.checkStoragePressure());

    // 2. Telemetry and Version checks
    const storedSchema = localStorage.getItem('proforma360_schema_version');
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';
    const storedAppVersion = localStorage.getItem('proforma360_app_version');

    if (storedAppVersion !== appVersion) {
      console.log(`[VersionGuard] App updated from ${storedAppVersion} to ${appVersion}`);
      localStorage.setItem('proforma360_app_version', appVersion);
    }
    
    if (!storedSchema) {
      // First boot or schema version cleared
      localStorage.setItem('proforma360_schema_version', SCHEMA_VERSION.toString());
      logTelemetry('BOOT_SUCCESS', { type: 'first_boot', schema: SCHEMA_VERSION });
      return 'VALID';
    }

    const parsedStored = parseInt(storedSchema, 10);
    
    if (parsedStored === SCHEMA_VERSION) {
      logTelemetry('BOOT_SUCCESS', { type: 'normal_boot', schema: SCHEMA_VERSION });
      return 'VALID';
    }
    
    if (parsedStored < SCHEMA_VERSION) {
      // In the future: Execute IndexedDB migrations sequentially here
      // e.g. runMigrations(parsedStored, SCHEMA_VERSION)
      // If it fails, return 'MIGRATION_FAILED'
      
      localStorage.setItem('proforma360_schema_version', SCHEMA_VERSION.toString());
      logTelemetry('BOOT_SUCCESS', { type: 'migration_success', from: parsedStored, to: SCHEMA_VERSION });
      return 'VALID';
    }
    
    // Downgrade detected: local DB was updated by a newer service worker/build,
    // but the currently running script is from an old cache.
    if (parsedStored > SCHEMA_VERSION) {
      console.error('[VersionGuard] Downgrade detected. Local schema is newer than app code.');
      logTelemetry('DOWNGRADE_DETECTED', { from: parsedStored, code_schema: SCHEMA_VERSION });
      return 'DOWNGRADE_DETECTED';
    }
    
    return 'VALID';
  } catch (err) {
    console.error('[VersionGuard] Fatal error during boot validation', err);
    logTelemetry('MIGRATION_FAILED', { error: String(err) });
    return 'MIGRATION_FAILED';
  }
};

const logTelemetry = (event: string, payload: any = {}) => {
  if (typeof window !== 'undefined') {
    try {
      const logs = JSON.parse(localStorage.getItem('proforma360_telemetry') || '[]');
      logs.push({ event, timestamp: Date.now(), ...payload });
      // Keep only last 50 events to avoid storage bloat
      if (logs.length > 50) logs.shift();
      localStorage.setItem('proforma360_telemetry', JSON.stringify(logs));
    } catch (e) {
      // ignore
    }
  }
};
