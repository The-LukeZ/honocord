export * from "@utils/Colors";
export * from "@utils/register";

export function parseCustomId(customId: string, onlyPrefix: true): string;
export function parseCustomId(
  customId: string,
  onlyPrefix?: false
): {
  compPath: string[];
  prefix: string;
  lastPathItem: string;
  component: string | null;
  params: string[];
  firstParam: string | null;
  lastParam: string | null;
};

/**
 * Parses a custom ID into its components.
 *
 * @param customId - The custom ID to parse.
 * @param onlyPrefix - If true, only returns the prefix of the custom ID.
 * @returns An object containing the parsed components or just the prefix.
 *
 * A custom ID is expected to be in the format: "prefix/component/other/path?param1/param2"
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
