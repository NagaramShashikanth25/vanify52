import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@/")) spec = pathToFileURL(path.join(root, spec.slice(2))).href;
  const relative = spec.startsWith(".") || spec.startsWith("file:");
  if (relative && !path.extname(spec)) {
    try { return await next(spec + ".js", ctx); } catch {}
  }
  return next(spec, ctx);
}
