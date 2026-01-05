export interface JiraRawIssue {
  key: string;
  fields: {
    summary: string;
    description?: any;
    customfield_acceptance?: string;
  };
}

export interface TicketIntent {
  ticketKey: string;
  summary: string;
  description?: string;
  acceptanceCriteria?: string;

  goals: string[];
  nonGoals: string[];
  constraints: string[];
}
