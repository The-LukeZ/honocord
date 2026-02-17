import { parse } from "node:path";

/**
 * Alternative to Node's `path.basename`, removing query string after the extension if it exists.
 * @param path Path to get the basename of
 * @param ext File extension to remove
 * @returns Basename of the path
 * @private
 */
export function basename(path: string, ext?: string): string {
  const res = parse(path);
  return ext && res.ext.startsWith(ext) ? res.name : res.base.split("?")[0];
}
