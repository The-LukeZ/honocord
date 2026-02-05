export * from "@utils/Colors";
export * from "@utils/registerCommands";

/**
 * Parse a custom ID string into its parts.
 *
 * Supports two modes:
 * - onlyPrefix = true: returns the prefix string before the first '/' or '?'.
 * - onlyPrefix = false (default): returns an object with parsed pieces.
 *
 * Expected customId shapes:
 * - "prefix/component/other/path?param1/param2"
 * - "prefix?param1/param2"
 *
 * @param customId - The custom ID to parse.
 * @param onlyPrefix - If true, only return the prefix string (default: false).
 * @returns If onlyPrefix is true: string (the prefix). Otherwise an object with:
 *  - compPath: string[] (full path split by '/'),
 *  - prefix: string (first item of compPath),
 *  - lastPathItem: string (last item of compPath),
 *  - component: string | null (second item of compPath or null),
 *  - params: string[] (params split by '/'; empty array when none),
 *  - firstParam: string | null,
 *  - lastParam: string | null
 *
 * @example
 * parseCustomId("modal/user/profile?123/abc")
 * // => { compPath: ["modal","user","profile"], prefix: "modal", ... params: ["123","abc"], ... }
 *
 * parseCustomId("button/click", true)
 * // => "button"
 */
export function parseCustomId(customId: string, onlyPrefix: boolean = false) {
  if (onlyPrefix) {
    const match = customId.match(/^(.+?)(\/|\?)/i);
    return match ? match[1] : customId;
  }
  const [path, params] = customId.split("?") as [string, string | undefined];
  const pathS = path.split("/");
  const parms = params?.split("/") || [];
  return {
    compPath: pathS,
    prefix: pathS[0],
    lastPathItem: pathS[pathS.length - 1],
    component: pathS[1] || null,
    params: parms || [],
    firstParam: parms[0] || null,
    lastParam: parms[parms.length - 1] || null,
  };
}
