// Fails when a guide page is missing from the sidebar (or listed twice).
// The guides sidebar is hand-grouped in src/config/sidebar.mjs, so a new page
// in src/content/docs/guides/ does not show up until someone adds it there.
import { readdir } from "node:fs/promises";

let sidebar;
try {
  ({ sidebar } = await import("../src/config/sidebar.mjs"));
} catch {
  console.error("FAIL: src/config/sidebar.mjs not found");
  process.exit(1);
}

const files = await readdir(new URL("../src/content/docs/guides/", import.meta.url));
const guides = files.filter((f) => /\.mdx?$/.test(f)).map((f) => `guides/${f.replace(/\.mdx?$/, "")}`);

const listed = [];
const walk = (items) => {
  for (const item of items) {
    if (typeof item === "string") listed.push(item);
    else if (item.slug) listed.push(item.slug);
    if (item.items) walk(item.items);
  }
};
walk(sidebar);

const problems = [];
for (const guide of guides) {
  const count = listed.filter((slug) => slug === guide).length;
  if (count === 0) problems.push(`missing ${guide}`);
  if (count > 1) problems.push(`listed ${count} times: ${guide}`);
}
for (const slug of listed) {
  if (slug.startsWith("guides/") && !guides.includes(slug)) problems.push(`no page for ${slug}`);
}
if (problems.length) {
  for (const p of problems) console.error(`FAIL ${p}`);
  process.exit(1);
}
console.log(`PASS (${guides.length} guides)`);
