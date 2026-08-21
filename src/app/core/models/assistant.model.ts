export interface AssistantAnswer {
  text: string;
  intent: string;
  matched: boolean;
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  text: string;
}
