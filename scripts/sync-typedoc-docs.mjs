import { readdir, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

// Copies typedoc-plugin-markdown's per-reflection output into the Starlight
// reference section, remapping typedoc's kind-based folder names onto the
// docs site's existing category names (interfaces/enumerations fold into
// "types" alongside type-aliases, since the sidebar has no separate category
// for them).
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(rootDir, "tooling/typedoc/generated");
const destDir = join(rootDir, "docs/src/content/docs/reference");

const KIND_DIR_MAP = {
  classes: "classes",
  functions: "functions",
  variables: "constants",
  "type-aliases": "types",
  interfaces: "types",
  enumerations: "types",
};
const KIND_DIRS = Object.keys(KIND_DIR_MAP);

// Folding interfaces/type-aliases/enumerations into one "types" directory
// changes relative link depth/targets for links typedoc generated assuming
// the original kind-based layout (e.g. `../interfaces/X.md` from a
// type-alias page must become `./X.md` once both live in `types/`).
function rewriteLinks(content, ownDestName) {
  const linkPattern = new RegExp(`\\((?:\\.\\./)?(${KIND_DIRS.join("|")})/([^)]+\\.md)\\)`, "g");
  return content.replace(linkPattern, (_match, kindDir, file) => {
    const targetDestName = KIND_DIR_MAP[kindDir];
    const prefix = targetDestName === ownDestName ? "./" : `../${targetDestName}/`;
    return `(${prefix}${file})`;
  });
}

async function main() {
  // Only clear the generated categories; leave reference/index.mdx (the
  // hand-written overview page) untouched.
  for (const destName of new Set(Object.values(KIND_DIR_MAP))) {
    await rm(join(destDir, destName), { recursive: true, force: true });
  }

  let count = 0;
  for (const [kindDir, destName] of Object.entries(KIND_DIR_MAP)) {
    const kindSrcDir = join(srcDir, kindDir);
    let entries;
    try {
      entries = await readdir(kindSrcDir, { withFileTypes: true });
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }

    const outDir = join(destDir, destName);
    await mkdir(outDir, { recursive: true });

    for (const entry of entries) {
      if (!entry.isFile() || extname(entry.name) !== ".md") continue;
      const content = await readFile(join(kindSrcDir, entry.name), "utf8");
      await writeFile(join(outDir, basename(entry.name)), rewriteLinks(content, destName));
      count++;
    }
  }

  console.log(`Synced ${count} generated reference page(s) into docs/src/content/docs/reference`);
}

main();
