// Everything the desktop shows, read from src/content/.
// On the local dev server (`npm run dev`) the git-ignored src/content/drafts.json is merged in,
// and every unconfirmed item or field is marked so the page can label it. Production builds
// never read drafts.json.
import { existsSync, readFileSync } from "node:fs";

const CONTENT = new URL("../content/", import.meta.url);
const isDev = process.env.ELEVENTY_RUN_MODE === "serve";

const read = (name) => JSON.parse(readFileSync(new URL(name, CONTENT), "utf8"));

function loadDrafts() {
  const file = new URL("drafts.json", CONTENT);
  return isDev && existsSync(file) ? read("drafts.json") : {};
}

// Overlay draft fields onto confirmed items (matched by slug) and insert whole draft items.
function merge(items, drafts = {}) {
  const fields = drafts.fields || {};
  const merged = items.map((item) => {
    const extra = fields[item.slug];
    if (!extra) return item;
    const { pending, ...values } = extra;
    return { ...item, ...values, draftFields: Object.keys(values), pending };
  });
  for (const extra of drafts.add || []) {
    const item = { ...extra, draft: true };
    const at = extra.after ? merged.findIndex((m) => m.slug === extra.after) + 1 : merged.length;
    merged.splice(at > 0 ? at : merged.length, 0, item);
  }
  return merged;
}

export default function () {
  const drafts = loadDrafts();
  const experience = read("experience.json");
  const projects = read("projects.json");
  const education = read("education.json");

  const roles = merge(experience.roles, drafts.experience);
  const research = merge(read("research.json"), drafts.research);

  const desk = {
    isDev,
    intro: drafts.intro ? { ...drafts.intro, draft: true } : null,
    roles,
    moreRoles: merge(experience.more, drafts.experience),
    research,
    projectFilters: projects.filters,
    projects: merge(projects.items, drafts.projects),
    skills: read("skills.json"),
    schools: merge(education.schools, drafts.education),
    certifications: merge(education.certifications, { add: drafts.education?.certifications }),
    letters: read("letters.json"),
  };

  // Tags offered in the Experience window's filter, in first-seen order.
  desk.roleTags = [...new Set(roles.flatMap((role) => role.tags || []))];

  // Pages that get their own shareable URL (and open as windows on the desktop).
  desk.articles = [
    ...roles.map((item) => ({ kind: "experience", slug: item.slug, title: item.headline, windowTitle: item.org, item })),
    ...research.map((item) => ({ kind: "research", slug: item.slug, title: item.headline, windowTitle: item.title, item })),
    // Projects open in a wider window, cover on the left.
    ...desk.projects
      .filter((item) => item.sections)
      .map((item) => ({ kind: "projects", slug: item.slug, title: item.name, windowTitle: item.name, wide: true, item })),
  ];

  return desk;
}
