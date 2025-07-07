// utils/memoryStore.ts

type Message = { role: 'user' | 'assistant'; content: string };

const memoryStore: Record<string, Message[]> = {};

// Get history for a user
export function getUserHistory(userId: string): Message[] {
  return memoryStore[userId] || [];
}

// Append message to user's history
export function appendToHistory(userId: string, message: Message) {
  if (!memoryStore[userId]) {
    memoryStore[userId] = [];
  }
  memoryStore[userId].push(message);

  // Optional: limit memory length (e.g., last 20 messages)
  if (memoryStore[userId].length > 20) {
    memoryStore[userId] = memoryStore[userId].slice(-20);
  }
}

// Clear memory for a user
export function clearUserHistory(userId: string) {
  delete memoryStore[userId];
}
