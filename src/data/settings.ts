import type { KeyValueStore } from './cache/key-value-store.js';

/**
 * The user's optional GitHub token.
 *
 * Stored in `chrome.storage.local`, which is **not encrypted**: it sits in the
 * browser profile on disk, readable by anything that can read the profile. The
 * options page says so in as many words. Never log this value.
 */
const TOKEN_KEY = 'githubToken';

export async function readToken(store: KeyValueStore): Promise<string | undefined> {
  const stored = await store.get([TOKEN_KEY]);
  const token = stored[TOKEN_KEY];
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

export async function writeToken(store: KeyValueStore, token: string): Promise<void> {
  const trimmed = token.trim();
  if (trimmed.length === 0) {
    await store.remove([TOKEN_KEY]);
    return;
  }
  await store.set({ [TOKEN_KEY]: trimmed });
}

export async function clearToken(store: KeyValueStore): Promise<void> {
  await store.remove([TOKEN_KEY]);
}
