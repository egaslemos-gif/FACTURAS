import { useRuntimeStateMachine } from "./runtimeStateMachine";

const CURRENT_KERNEL_VERSION = "1.0.0";
const MINIMUM_COMPATIBLE_KERNEL_VERSION = "1.0.0";

export interface VersionInfo {
  runtimeKernelVersion: string;
  runtimeSchemaVersion: number;
  snapshotVersion: string | null;
  journalVersion: number | null;
  queueVersion: number | null;
}

export class RuntimeVersioningGuard {
  public getKernelVersion() {
    return CURRENT_KERNEL_VERSION;
  }

  public validateSnapshotCompatibility(snapshotKernelVersion: string): boolean {
    // Basic semver check logic for compatibility
    if (!this.isCompatible(snapshotKernelVersion, MINIMUM_COMPATIBLE_KERNEL_VERSION)) {
      console.error(`[VersioningGuard] Snapshot version ${snapshotKernelVersion} is below minimum compatible version ${MINIMUM_COMPATIBLE_KERNEL_VERSION}.`);
      return false;
    }
    return true;
  }

  public evaluateMigrationNeeds(versionInfo: VersionInfo): { migrationRequired: boolean; migrationBlocked: boolean } {
    let migrationRequired = false;
    let migrationBlocked = false;

    // Check if snapshot is fundamentally incompatible with current codebase
    if (versionInfo.snapshotVersion && !this.validateSnapshotCompatibility(versionInfo.snapshotVersion)) {
       migrationBlocked = true;
    }

    // Example logic: if journal version is older, we might need a runtime schema migration
    if (versionInfo.journalVersion && versionInfo.journalVersion < versionInfo.runtimeSchemaVersion) {
       migrationRequired = true;
    }

    if (migrationBlocked) {
       useRuntimeStateMachine.getState().dispatch({
         type: "FAILURE_DETECTED",
         failure: "CORRUPTED",
         technicalReason: `Runtime Migration Blocked. Snapshot (${versionInfo.snapshotVersion}) is deprecated.`,
         operatorReason: "A versão dos seus dados guardados é demasiado antiga e já não é suportada por esta versão do sistema."
       });
    }

    return { migrationRequired, migrationBlocked };
  }

  private isCompatible(version: string, minVersion: string): boolean {
    const parse = (v: string) => v.split('.').map(Number);
    const [vMajor, vMinor, vPatch] = parse(version);
    const [mMajor, mMinor, mPatch] = parse(minVersion);

    if (vMajor > mMajor) return true;
    if (vMajor < mMajor) return false;

    if (vMinor > mMinor) return true;
    if (vMinor < mMinor) return false;

    if (vPatch >= mPatch) return true;
    return false;
  }
}

export const runtimeVersioningGuard = new RuntimeVersioningGuard();
