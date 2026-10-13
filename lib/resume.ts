import { existsSync } from "node:fs";
import path from "node:path";
import { site } from "@/data/site";

/**
 * Returns the résumé URL when the file is present in /public, otherwise null.
 * Evaluated at build/render time so dropping in the file is all that's needed.
 */
export function getResumeHref(): string | null {
  const file = path.join(process.cwd(), "public", site.resumePath.replace(/^\//, ""));
  return existsSync(file) ? site.resumePath : null;
}
