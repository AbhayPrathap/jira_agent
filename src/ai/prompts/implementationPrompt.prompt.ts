import { RepoContext } from "../../context/repoContext.types";
import { TicketIntent } from "../../jira/jira.types";

export interface MarkupContent {
  questions?: Record<string, string>;
  risks?: Record<string, string>;
  intent?: string;
  impactedAreas?: string[];
}

export function buildImplementationPrompt(
  markUpContent: MarkupContent,
  ticket: TicketIntent,
  repoContext: RepoContext
): string {
  const promptArtifacts = {
    id: "code-implementation",
    title: "Implement Ticket Changes",
    role: "Senior software engineer implementing code changes based on ticket analysis",
    inputContext: buildInputContext(markUpContent, ticket, repoContext),
    instructions: `
1. Review the confirmed ticket intent and all documented decisions
2. Understand the impacted areas and modules
3. Review all answered questions and risk mitigations
4. Implement the necessary code changes to fulfill the ticket requirements
5. Follow the project's coding standards and patterns
6. Ensure all decisions and clarifications are properly implemented
`.trim(),
    outputContract: `
Implement the code changes by:
- Creating or modifying files in the impacted areas
- Following the decisions documented in the questions and answers
- Addressing the risks with appropriate mitigations
- Ensuring code quality, tests, and documentation
`.trim(),
    executionNotes: "Start implementing the changes now. Make actual code edits to the codebase."
  };

  function formatPrompt(p: typeof promptArtifacts): string {
    return `
# ${p.title}

## ROLE
${p.role}

## INPUT
${p.inputContext}

## TASK
${p.instructions}

## OUTPUT FORMAT
${p.outputContract}

${p.executionNotes ? `## NOTES\n${p.executionNotes}` : ""}
`.trim();
  }

  return formatPrompt(promptArtifacts);
}

function buildInputContext(
  markUpContent: MarkupContent,
  ticket: TicketIntent,
  repoContext: RepoContext
): string {
  const sections: string[] = [];

  sections.push(`<JIRA_TICKET>
${JSON.stringify(ticket, null, 2)}
</JIRA_TICKET>`);

  sections.push(`<REPO_CONTEXT>
${JSON.stringify(repoContext, null, 2)}
</REPO_CONTEXT>`);

  if (markUpContent.intent) {
    sections.push(`<CONFIRMED_INTENT>
${markUpContent.intent}
</CONFIRMED_INTENT>`);
  }

  if (markUpContent.impactedAreas && markUpContent.impactedAreas.length > 0) {
    sections.push(`<IMPACTED_AREAS>
${markUpContent.impactedAreas.map(area => `- ${area}`).join('\n')}
</IMPACTED_AREAS>`);
  }

  if (markUpContent.questions && Object.keys(markUpContent.questions).length > 0) {
    const questionsSection = Object.entries(markUpContent.questions)
      .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
      .join('\n\n');
    sections.push(`<QUESTIONS_AND_ANSWERS>
${questionsSection}
</QUESTIONS_AND_ANSWERS>`);
  }

  if (markUpContent.risks && Object.keys(markUpContent.risks).length > 0) {
    const risksSection = Object.entries(markUpContent.risks)
      .map(([risk, mitigation]) => `Risk: ${risk}\nMitigation: ${mitigation}`)
      .join('\n\n');
    sections.push(`<RISKS_AND_MITIGATIONS>
${risksSection}
</RISKS_AND_MITIGATIONS>`);
  }

  return sections.join('\n\n');
}
