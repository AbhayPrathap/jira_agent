import * as fs from "fs";
import * as path from "path";
import { RepoContext } from "./repoContext.types";
import { getWorkspaceRoots } from "./workspace";

export function scanRepoContext(): RepoContext {
  const roots = getWorkspaceRoots();

  let isFrontend = false;
  let isBackend = false;
  let hasNestConfig = false;
  const packageManagers: Set<RepoContext["packageManagers"][number]> = new Set();
  const importantFiles: string[] = [];
  const entryPoints: string[] = [];

  for (const root of roots) {
    const files = fs.readdirSync(root);

    const hasPackageJson = files.includes("package.json");
    const folderIsFrontend = hasPackageJson && files.includes("vite.config.mts");
    const folderIsBackend =
      files.includes("nest-cli.json") || files.includes("server") || files.includes("backend");

    if (folderIsFrontend) {
      isFrontend = true;
    }
    if (folderIsBackend) {
      isBackend = true;
    }
    if (files.includes("nest-cli.json")) {
      hasNestConfig = true;
    }

    if (files.includes("package-lock.json")) {
      packageManagers.add("npm");
    }

    ["package.json", "tsconfig.json", "nest-cli.json"].forEach((f) => {
      if (files.includes(f)) {
        importantFiles.push(path.join(root, f));
      }
    });

    const folderEntryPoints = detectEntryPoints(root);
    entryPoints.push(...folderEntryPoints);
  }

  return {
    isFrontend,
    isBackend,
    frontendFramework: isFrontend ? "react" : undefined,
    backendFramework: hasNestConfig ? "nestjs" : undefined,
    packageManagers: Array.from(packageManagers),
    entryPoints,
    importantFiles,
  };
}

function detectEntryPoints(root: string): string[] {
  const candidates = [
    // Frontend
    "src/main.tsx",
    "src/main.ts",
    "src/index.tsx",
    "src/index.ts",

    // Backend
    "src/main.ts",
    "server.ts",
    "app.ts",
  ];

  return candidates
    .filter((p) => fs.existsSync(path.join(root, p)))
    .map((p) => path.join(root, p));
}
