import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { researchAgent } from './agents/TrendAgent';
import { tradeDecisionWorkflow } from './workflows/tradeDecisionWorkflow';

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: 'file:../mastra.db',
  }),
  agents: {
    researchAgent,
  },
  workflows: { tradeDecisionWorkflow },
});
