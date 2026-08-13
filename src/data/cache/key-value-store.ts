/**
 * The slice of `chrome.storage.local` the cache actually uses.
 *
 * Narrow on purpose: it keeps the cache logic runnable under Vitest, where no
 * browser exists, and it documents exactly how much power the cache has over
 * the extension's storage.
 */
export interface KeyValueStore {
  /** Null reads everything, which is what eviction needs. */
  get(keys: string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}
