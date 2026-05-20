export function moderationPrompt(text: string): string {
  return `Classify this user message for a cozy wellness food app. Return JSON: {"status":"safe"|"restrict_eating"|"medical"|"hate"}

Message: ${text.slice(0, 500)}`;
}
