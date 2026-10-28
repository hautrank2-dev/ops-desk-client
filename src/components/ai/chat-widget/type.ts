export type ChatUiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  thinking?: string;
  streaming?: boolean;
  error?: boolean;
};

export type ChatSseEvent =
  | { event: "meta"; data: { conversationId: string } }
  | { event: "thinking"; data: { text: string } }
  | { event: "text"; data: { text: string } }
  | { event: "error"; data: { message: string } }
  | { event: "done"; data: unknown };
