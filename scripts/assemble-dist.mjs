import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(root, "..");
const output = path.join(projectRoot, "dist");
const appsRoot = path.join(projectRoot, "apps");
const portalDist = path.join(appsRoot, "portal", "dist");

await rm(output, { recursive: true, force: true });
await cp(portalDist, output, { recursive: true });

const apps = await readdir(appsRoot, { withFileTypes: true });
for (const app of apps) {
  if (!app.isDirectory() || app.name === "portal") continue;

  const appDist = path.join(appsRoot, app.name, "dist");
  const appOutput = path.join(output, app.name);
  await mkdir(appOutput, { recursive: true });

  try {
    await cp(appDist, appOutput, { recursive: true });
  } catch (error) {
    await rm(appOutput, { recursive: true, force: true });
    if (error?.code === "ENOENT") continue;
    throw error;
  }
}

console.log(`Assembled game portal into ${output}`);
