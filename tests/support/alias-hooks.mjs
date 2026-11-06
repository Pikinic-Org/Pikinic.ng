// Lets Node's built-in test runner load the app's TypeScript as-is: maps the "@/..." import alias
// (tsconfig paths) to src/, and finds extensionless imports by trying .ts, .tsx and index.ts.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");
const candidates = (base) => [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];

export async function resolve(specifier, context, nextResolve) {
  let base = null;
  if (specifier.startsWith("@/")) {
    base = path.join(srcDir, specifier.slice(2));
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }

  if (base) {
    const found = candidates(base).find((file) => existsSync(file) && path.extname(file));
    if (found) return nextResolve(pathToFileURL(found).href, context);
  }
  return nextResolve(specifier, context);
}
