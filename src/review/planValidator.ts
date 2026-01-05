import { ChangePlan } from "../ai/types/changePlan.types";

export interface ReviewResult {
  unexpectedFiles: string[];
  allowedFiles: string[];
}

export function validateAgainstPlan(
  changedFiles: string[],
  plan: ChangePlan
): ReviewResult {
  const allowed = [...plan.frontendFiles, ...plan.backendFiles];

  const unexpectedFiles = changedFiles.filter((f) => !allowed.includes(f));

  const allowedFiles = changedFiles.filter((f) => allowed.includes(f));

  return { unexpectedFiles, allowedFiles };
}
