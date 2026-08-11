/**
 * The repository's file list, shaped around the questions checks actually ask.
 *
 * Handing checks a bare `string[]` would push the same three concerns into
 * every one of them: matching casing (`README.md`, `readme.md` and `Readme.md`
 * are all in the wild), telling "this file is absent" apart from "we never saw
 * the whole tree", and recovering the real path to link to as evidence.
 */
export class FileIndex {
  private readonly byLowercasePath: Map<string, string>;

  /**
   * @param isComplete false when GitHub truncated the tree. A miss is then
   * unproven rather than absent, and checks must report `unknown`.
   */
  constructor(
    paths: readonly string[],
    readonly isComplete: boolean,
  ) {
    this.byLowercasePath = new Map(paths.map((path) => [path.toLowerCase(), path]));
  }

  /** The real path of the first candidate that exists, casing preserved. */
  find(...candidates: string[]): string | null {
    for (const candidate of candidates) {
      const match = this.byLowercasePath.get(candidate.toLowerCase());
      if (match !== undefined) {
        return match;
      }
    }
    return null;
  }

  /** True when at least one file lives under this directory. */
  hasUnder(directory: string): boolean {
    const prefix = `${directory.toLowerCase()}/`;
    for (const path of this.byLowercasePath.keys()) {
      if (path.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }
}
