import { AxiosInstance } from "axios";
import { JiraRawIssue, TicketIntent } from "./jira.types";
import { mapJiraToIntent } from "./jiraMapper";

export class JiraService {
  constructor(private client: AxiosInstance) {}

  async getTicketIntent(ticketKey: string): Promise<TicketIntent> {
    const response = await this.client.get<JiraRawIssue>(
      `/rest/api/3/issue/${ticketKey}`
    );

    return mapJiraToIntent(response.data);
  }
}
