export type Model = {
  id: string
  name: string
  shortName: string
  defaultReasoning: string
}

const models: Model[] = [
  {
    id: "gpt-5.5",
    name: "GPT-5.5",
    shortName: "5.5",
    defaultReasoning: "Low",
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    shortName: "5.4",
    defaultReasoning: "Medium",
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    shortName: "5.4 Mini",
    defaultReasoning: "Medium",
  },
]

export function listModels() {
  return models
}

export function getDefaultModel() {
  return models[0]
}
