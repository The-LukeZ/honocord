import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/** @param {import("typedoc-plugin-markdown").MarkdownApplication} app */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    const reflection = page.model;
    const title = reflection && "name" in reflection ? reflection.name : page.url.replace(/\.md$/, "");

    page.frontmatter = {
      title,
      ...page.frontmatter,
    };
  });
}
