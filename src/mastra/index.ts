import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { cryptoResearchAgent } from "./agents/cryptoResearchAgent";

export const mastra = new Mastra({
  storage: new LibSQLStore({
    url: "file:../mastra.db",
  }),
  agents: {
    cryptoResearchAgent,
  },
});
