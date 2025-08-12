import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { researchWorkflow } from './workflows/researchWorkflow';
import { researchAgent } from './agents/TrendAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
import { tradeDecisionWorkflow } from './workflows/tradeDecisionWorkflow';

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: 'file:../mastra.db',
  }),
  agents: {
    researchAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow, tradeDecisionWorkflow },
});
