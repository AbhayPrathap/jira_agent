export interface RepoContext {
  isFrontend: boolean;
  isBackend: boolean;

  frontendFramework?: "react" | "vue" | "angular" | "unknown";
  backendFramework?: "nestjs" | "express" | "unknown";

  packageManagers: ("npm" | "yarn" | "pnpm")[];
  entryPoints: string[];

  importantFiles: string[];
}
