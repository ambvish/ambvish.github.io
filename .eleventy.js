import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

// Text that must never reach the live site: unconfirmed copy, notes to self, draft labels.
const FORBIDDEN = [/\[CONFIRM/, /\bTODO\b/, /\bDRAFT\b/];

async function builtTextFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(html|css|js|json|xml|txt|svg)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

export default function (eleventyConfig) {
  // CSS, JS and images are copied to the output unchanged.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.png": "favicon.png" });
  // Public résumé (phone number removed). Check any replacement the same way before adding it.
  eleventyConfig.addPassthroughCopy({ "src/resume.pdf": "resume.pdf" });

  // Site content lives in src/content/ and is read by src/_data/desk.js.
  eleventyConfig.addWatchTarget("src/content/");

  // Writing: external links open in a new tab with a ↗, and a [^1] marker becomes a numbered
  // sidenote (shown in the margin on wide windows, under the line on narrow ones).
  const externalLinks = (html) =>
    html.replace(
      /<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g,
      (_, href, text) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}<span aria-hidden="true"> ↗</span><span class="visually-hidden"> (opens in a new tab)</span></a>`,
    );
  eleventyConfig.addFilter("prose", (html, notes = {}) =>
    externalLinks(html).replace(/\[\^(\d+)\]/g, (_, n) => {
      if (!notes[n]) throw new Error(`Writing: note [^${n}] has no text`);
      return `<sup class="fn">${n}</sup><span class="sidenote" role="note"><sup class="sidenote__n">${n}</sup> ${externalLinks(notes[n])}</span>`;
    }),
  );

  // Production builds start from an empty folder, so nothing left over from `npm run dev` can ship.
  eleventyConfig.on("eleventy.before", async ({ directories, runMode }) => {
    if (runMode === "build") await rm(directories.output, { recursive: true, force: true });
  });

  // Production guard: fail the build, and so the deploy, if forbidden text made it into the output.
  eleventyConfig.on("eleventy.after", async ({ directories, runMode }) => {
    if (runMode !== "build") return;
    const problems = [];
    for (const file of await builtTextFiles(directories.output)) {
      const text = await readFile(file, "utf8");
      for (const pattern of FORBIDDEN) {
        if (pattern.test(text)) problems.push(`${path.relative(directories.output, file)} contains ${pattern.source}`);
      }
    }
    if (problems.length) {
      throw new Error(`Refusing to publish unconfirmed or draft text:\n  ${problems.join("\n  ")}`);
    }
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
