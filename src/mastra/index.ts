import { Mastra } from "@mastra/core/mastra";
import { learningAgent } from "./agents/learning-agent";

export const mastra = new Mastra({
  agents: {
    learningAgent,
  },
});
