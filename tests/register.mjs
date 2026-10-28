// Lets plain Node import the app's lib/ files the way Next does:
// "@/lib/x" aliases and extensionless relative imports.
import { register } from "node:module";
register("./resolve.mjs", import.meta.url);
