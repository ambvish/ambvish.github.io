import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

// Text that must never reach the live site: unconfirmed copy, notes to self, draft labels.
const FORBIDDEN = [/\[CONFIRM/, /\bTODO\b/, /\bDRAFT\b/];

// Project-card color, picked from a project's first tag.
const TONES = {
  "AI/ML": "ai",
  "Computer Vision": "vision",
  Web: "web",
  Backend: "backend",
  Hardware: "hardware",
  Research: "research",
  Healthcare: "health",
};

async function builtTextFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(html|css|js|json|xml|txt|svg)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

export default function (eleventyConfig) {
  // CSS, JS and images are copied to the output unchanged.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
  // Public résumé: the phone number is removed (see PLAN.md checklist before replacing it).
  eleventyConfig.addPassthroughCopy({ "src/resume.pdf": "resume.pdf" });

  // Site content lives in src/content/ and is read by src/_data/desk.js.
  eleventyConfig.addWatchTarget("src/content/");

  eleventyConfig.addFilter("tone", (tag) => TONES[tag] || "neutral");

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
