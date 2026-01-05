import * as fs from "fs";
import * as path from "path";
import { RepoContext } from "./repoContext.types";
import { getWorkspaceRoot } from "./workspace";

export function scanRepoContext(): RepoContext {
  const root = getWorkspaceRoot();

  const files = fs.readdirSync(root);

  const hasPackageJson = files.includes("package.json");
  const hasNestConfig = files.includes("nest-cli.json");
  const hasTsConfig = files.includes("tsconfig.json");

  const isFrontend = hasPackageJson && files.includes("src");
  const isBackend =
    hasNestConfig || files.includes("server") || files.includes("backend");

  const packageManagers: RepoContext["packageManagers"] = [];
  if (files.includes("package-lock.json")) {
    packageManagers.push("npm");
  }
  if (files.includes("yarn.lock")) {
    packageManagers.push("yarn");
  }
  if (files.includes("pnpm-lock.yaml")) {
    packageManagers.push("pnpm");
  }

  const importantFiles: string[] = [];
  ["package.json", "tsconfig.json", "nest-cli.json"].forEach((f) => {
    if (files.includes(f)) {
      importantFiles.push(f);
    }
  });

  return {
    isFrontend,
    isBackend,
    frontendFramework: isFrontend ? "react" : undefined,
    backendFramework: hasNestConfig ? "nestjs" : undefined,
    packageManagers,
    entryPoints: detectEntryPoints(root),
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

  return candidates.filter((p) => fs.existsSync(path.join(root, p)));
}
