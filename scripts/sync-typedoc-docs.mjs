import { readdir, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

// Copies typedoc-plugin-markdown's per-reflection output into the docs site's
// reference section, one SvelteKit route per reflection
// (docs/src/routes/reference/<category>/<Name>/+page.md), remapping typedoc's
// kind-based folder names onto the site's category names
// (interfaces/enumerations fold into "types" alongside type-aliases).
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(rootDir, "tooling/typedoc/generated");
const destDir = join(rootDir, "docs/src/routes/reference");

const KIND_DIR_MAP = {
  classes: "classes",
  functions: "functions",
  variables: "constants",
  "type-aliases": "types",
  interfaces: "types",
  enumerations: "types",
};
const KIND_DIRS = Object.keys(KIND_DIR_MAP);

// Sidebar group and its place in the "Reference" section (the hand-written
// overview at reference/+page.md has order 40).
const CATEGORIES = {
  classes: { section: "Classes", order: 41 },
  functions: { section: "Functions", order: 42 },
  constants: { section: "Constants", order: 43 },
  types: { section: "Types", order: 44 },
};

// Links typedoc generated assuming its kind-based layout (`../interfaces/X.md`,
// or a bare `X.md` beside the page) become absolute route URLs.
function rewriteLinks(content, ownKindDir) {
  const kindLink = new RegExp(`\\]\\((?:\\.\\./)?(${KIND_DIRS.join("|")})/([^)#]+)\\.md(#[^)]*)?\\)`, "g");
  content = content.replace(kindLink, (_m, kindDir, name, hash = "") => `](/reference/${KIND_DIR_MAP[kindDir]}/${name}${hash})`);
  const sibling = /\]\((?!https?:|\/|#)([^)#/]+)\.md(#[^)]*)?\)/g;
  return content.replace(sibling, (_m, name, hash = "") => `](/reference/${KIND_DIR_MAP[ownKindDir]}/${name}${hash})`);
}

// docsmith compiles pages with mdsvex, where prose is Svelte markup: a `{` starts
// an expression and a `<` a tag. Escape both outside code spans and fences: `<`
// as an entity, a brace as a Svelte expression that prints it (the markdown
// parser decodes a brace entity back into a bare brace).
// typedoc writes `\<`, `\>`, `\{`, `\}` for markdown; drop the backslash too. A bare
// `>` is left alone: it is harmless in Svelte text and starts typedoc's signature
// blockquotes.
function escapeForSvelte(content) {
  const out = [];
  let inFence = false;
  for (const line of content.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    // Split on code spans, escape only the text between them.
    const parts = line.split(/(`+[^`]*`+)/);
    out.push(
      parts
        .map((part, i) =>
          i % 2 === 1
            ? part
            : part
                .replace(/\\?</g, "&lt;")
                .replace(/\\>/g, "&gt;")
                // No quotes: the markdown pipeline would turn them into smart quotes.
                .replace(/\\?([{}])/g, (_m, brace) => `{String.fromCharCode(${brace.charCodeAt(0)})}`)
        )
        .join("")
    );
  }
  return out.join("\n");
}

// The page's H1 comes from the frontmatter title, so drop typedoc's own
// `# Class: X` heading, and give the page its sidebar place.
function withPageMeta(content, category, description) {
  const { section, order } = CATEGORIES[category];
  content = content.replace(/^---\n([\s\S]*?)\n---\n/, (_m, fm) => {
    const lines = [fm.trim(), `section: [Reference, ${section}]`, `order: ${order}`];
    if (description) lines.push(`description: ${JSON.stringify(description)}`);
    return `---\n${lines.join("\n")}\n---\n`;
  });
  return content.replace(/^# .*\n+/m, "");
}

// The first prose paragraph after the "Defined in" line, for the page description.
function firstParagraph(content) {
  // Only the intro before the first `##` section: a later paragraph describes a member, not the page.
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, "").split(/\n## /)[0];
  for (const block of body.split(/\n{2,}/)) {
    const text = block.trim();
    if (!text || /^(#|Defined in:|>|```|\||\*\*\*)/.test(text)) continue;
    const plain = text
      .replace(/\s+/g, " ")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[`*\\]/g, "");
    // The first sentence, or the first 200 characters cut at a word.
    const sentence = plain.match(/^.*?[.!?](?=\s|$)/)?.[0];
    if (sentence && sentence.length <= 200) return sentence;
    return plain.length <= 200 ? plain : `${plain.slice(0, 200).replace(/\s+\S*$/, "")}…`;
  }
  return undefined;
}

async function main() {
  // Only clear the generated categories; leave reference/+page.md and
  // reference/+layout.svelte (hand-written) untouched.
  for (const category of Object.keys(CATEGORIES)) {
    await rm(join(destDir, category), { recursive: true, force: true });
  }

  let count = 0;
  for (const [kindDir, category] of Object.entries(KIND_DIR_MAP)) {
    const kindSrcDir = join(srcDir, kindDir);
    let entries;
    try {
      entries = await readdir(kindSrcDir, { withFileTypes: true });
    } catch (err) {
      if (err.code === "ENOENT") continue;
      throw err;
    }

    for (const entry of entries) {
      if (!entry.isFile() || extname(entry.name) !== ".md") continue;
      const raw = (await readFile(join(kindSrcDir, entry.name), "utf8")).replace(/\r\n/g, "\n");
      // Escape the body only: the frontmatter is YAML, not Svelte markup.
      const page = withPageMeta(rewriteLinks(raw, kindDir), category, firstParagraph(raw));
      const [, front, body] = page.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
      const content = front + escapeForSvelte(body);
      const outDir = join(destDir, category, basename(entry.name, ".md"));
      await mkdir(outDir, { recursive: true });
      await writeFile(join(outDir, "+page.md"), content);
      count++;
    }
  }

  console.log(`Synced ${count} generated reference page(s) into docs/src/routes/reference`);
}

main();
