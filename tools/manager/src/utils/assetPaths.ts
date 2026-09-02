import path from 'path';
import fs from 'fs';

/**
 * Robustly resolves the project root directory whether executing from
 * the root workspace, tools/manager, or scripts.
 */
export function getProjectRoot(): string {
  const cwd = process.cwd();
  let curr = cwd;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'firebase.json')) || fs.existsSync(path.join(curr, '.firebaserc'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return path.resolve(cwd, '..', '..');
}

/**
 * Returns the primary local_data directory.
 */
export function getLocalDataDir(): string {
  return path.join(getProjectRoot(), 'local_data');
}

/**
 * Resolves the proceedings directory with automatic fallback:
 * Prefers `local_data/proceedings` if it exists; otherwise falls back
 * to `docs/archives_translation/proceedings` during phased migration.
 */
export function getProceedingsDir(): string {
  const root = getProjectRoot();
  const localDataPath = path.join(root, 'local_data', 'proceedings');
  if (fs.existsSync(localDataPath)) {
    return localDataPath;
  }
  return path.join(root, 'docs', 'archives_translation', 'proceedings');
}

/**
 * Resolves a specific workshop directory with automatic dual-path fallback.
 * E.g., checks `local_data/proceedings/1st` first, falls back to `docs/.../1st`.
 */
export function getWorkshopDir(wsOrdinal: string): string {
  const root = getProjectRoot();
  const localWsPath = path.join(root, 'local_data', 'proceedings', wsOrdinal);
  if (fs.existsSync(localWsPath)) {
    return localWsPath;
  }
  return path.join(root, 'docs', 'archives_translation', 'proceedings', wsOrdinal);
}

/**
 * Resolves the sponsors directory with automatic fallback.
 */
export function getSponsorsDir(): string {
  const root = getProjectRoot();
  const localSponsorsPath = path.join(root, 'local_data', 'sponsors');
  if (fs.existsSync(localSponsorsPath)) {
    return localSponsorsPath;
  }
  return path.join(root, 'docs', 'archives_translation', 'sponsors');
}

/**
 * Resolves the canonical registries directory (`docs/registries`).
 */
export function getRegistriesDir(): string {
  return path.join(getProjectRoot(), 'docs', 'registries');
}

/**
 * Resolves the master workshops JSON path in the frontend.
 */
export function getMasterWorkshopsPath(): string {
  return path.join(getProjectRoot(), 'src', 'frontend', 'src', 'data', 'master_workshops.json');
}

/**
 * Resolves the archives JSON directory in the frontend.
 */
export function getArchivesDataDir(): string {
  return path.join(getProjectRoot(), 'src', 'frontend', 'src', 'data', 'archives');
}

/**
 * Resolves corporate registry JSON path in the frontend.
 */
export function getCorporateRegistryPath(): string {
  return path.join(getProjectRoot(), 'src', 'frontend', 'src', 'data', 'corporate_registry.json');
}

/**
 * Resolves the deployed public sponsors images directory in the frontend.
 */
export function getFrontendSponsorsDir(): string {
  return path.join(getProjectRoot(), 'src', 'frontend', 'public', 'images', 'sponsors');
}
