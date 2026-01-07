export interface JiraRawIssue {
  key: string;
  fields: {
    summary: string;
    description?: any;
  };
}

export interface TicketIntent {
  ticketKey: string;
  summary: string;
  description?: string;

  goals: string[];
  nonGoals: string[];
  constraints: string[];
}
