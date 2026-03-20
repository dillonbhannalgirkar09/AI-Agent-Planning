export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  versionHistory?: SectionVersion[];
}

export interface SectionVersion {
  id: string;
  content: string;
  editInstruction: string;
  timestamp: string;
}

export interface Report {
  id: string;
  problemStatement: string;
  sections: ReportSection[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentStep {
  agent: 'planner' | 'insight' | 'execution';
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: any;
  reasoning?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface PlannerOutput {
  components: {
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  scope: string;
  constraints: string[];
  assumptions: string[];
}

export interface InsightOutput {
  enrichedComponents: {
    name: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    risks: string[];
    opportunities: string[];
  }[];
  stakeholders: {
    name: string;
    role: string;
    impact: string;
  }[];
  marketContext: string;
  technicalConsiderations: string;
}

export interface ExecutionOutput {
  sections: ReportSection[];
}

export interface AgentPipelineResult {
  steps: AgentStep[];
  report: Report;
}

export interface EditRequest {
  sectionId: string;
  currentContent: string;
  instruction: string;
  problemStatement: string;
  sectionTitle: string;
}

export interface EditResponse {
  newContent: string;
  changes: string;
}