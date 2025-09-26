import { AI } from "@raycast/api";
import { ParsedMessage, Snippet } from "./claudeMessages";

export async function semanticSearch(
  messages: ParsedMessage[],
  query: string,
): Promise<ParsedMessage[]> {
  if (!query.trim() || messages.length === 0) {
    return messages;
  }

  // Test trigger for error
  if (query.toLowerCase() === "trigger error") {
    throw new Error("Test error triggered");
  }

  // Simulate non-Pro user
  if (query.toLowerCase() === "non ai user") {
    throw new Error(
      "AI features are only available with a Raycast Pro subscription",
    );
  }

  try {
    // Prepare messages with their full content for semantic matching
    const messagesData = messages.map((msg, index) => ({
      index,
      content: msg.content,
      preview: msg.preview,
    }));

    const prompt = `You are a search assistant. Given the following messages and a search query, return the indices of messages that semantically match the query.

Messages:
${messagesData
  .map((m) => `[${m.index}] ${m.content.substring(0, 500)}...`)
  .join("\n\n")}

Search query: "${query}"

You MUST return ONLY a valid JSON array of indices. No explanation, no text before or after, just the array.
Consider conceptual similarity, not just keyword matching.
Return empty array [] if no matches found.

Examples of valid responses:
[0, 2, 5]
[1]
[]`;

    const response = await AI.ask(prompt, {
      model: AI.Model.Anthropic_Claude_Haiku,
    });

    // Try to extract JSON from the response
    let matchedIndices: number[];

    // First try direct parsing
    try {
      matchedIndices = JSON.parse(response) as number[];
    } catch {
      // If that fails, try to find a JSON array in the response
      const arrayMatch = response.match(/\[[\d,\s]*\]/);
      if (arrayMatch) {
        matchedIndices = JSON.parse(arrayMatch[0]) as number[];
      } else {
        throw new Error("No valid JSON array found in response");
      }
    }

    // Filter and return matched messages
    return messages.filter((_, index) => matchedIndices.includes(index));
  } catch (error) {
    console.error("AI search failed:", error);
    // Fallback to regular search
    return messages.filter(
      (msg) =>
        msg.content.toLowerCase().includes(query.toLowerCase()) ||
        msg.preview.toLowerCase().includes(query.toLowerCase()),
    );
  }
}

export function normalSearch(
  messages: ParsedMessage[],
  searchText: string,
): ParsedMessage[] {
  if (!searchText.trim()) {
    return messages;
  }

  const query = searchText.toLowerCase();
  return messages.filter(
    (msg) =>
      msg.content.toLowerCase().includes(query) ||
      msg.preview.toLowerCase().includes(query),
  );
}

export async function semanticSearchSnippets(
  snippets: Snippet[],
  query: string,
): Promise<Snippet[]> {
  if (!query.trim() || snippets.length === 0) {
    return snippets;
  }

  // Test trigger for error
  if (query.toLowerCase() === "trigger error") {
    throw new Error("Test error triggered");
  }

  // Simulate non-Pro user
  if (query.toLowerCase() === "non ai user") {
    throw new Error(
      "AI features are only available with a Raycast Pro subscription",
    );
  }

  try {
    // Prepare snippets with their full content for semantic matching
    const snippetsData = snippets.map((snippet, index) => ({
      index,
      title: snippet.title,
      content: snippet.content,
    }));

    const prompt = `You are a search assistant. Given the following snippets and a search query, return the indices of snippets that semantically match the query.

Snippets:
${snippetsData
  .map(
    (s) =>
      `[${s.index}] Title: ${s.title}\nContent: ${s.content.substring(0, 500)}...`,
  )
  .join("\n\n")}

Search query: "${query}"

You MUST return ONLY a valid JSON array of indices. No explanation, no text before or after, just the array.
Consider conceptual similarity, not just keyword matching.
Return empty array [] if no matches found.

Examples of valid responses:
[0, 2, 5]
[1]
[]`;

    const response = await AI.ask(prompt, {
      model: AI.Model.Anthropic_Claude_Haiku,
    });

    // Try to extract JSON from the response
    let matchedIndices: number[];

    // First try direct parsing
    try {
      matchedIndices = JSON.parse(response) as number[];
    } catch {
      // If that fails, try to find a JSON array in the response
      const arrayMatch = response.match(/\[[\d,\s]*\]/);
      if (arrayMatch) {
        matchedIndices = JSON.parse(arrayMatch[0]) as number[];
      } else {
        throw new Error("No valid JSON array found in response");
      }
    }

    // Filter and return matched snippets
    return snippets.filter((_, index) => matchedIndices.includes(index));
  } catch (error) {
    console.error("AI search failed:", error);
    // Fallback to regular search
    return snippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        snippet.content.toLowerCase().includes(query.toLowerCase()),
    );
  }
}

export function normalSearchSnippets(
  snippets: Snippet[],
  searchText: string,
): Snippet[] {
  if (!searchText.trim()) {
    return snippets;
  }

  const query = searchText.toLowerCase();
  return snippets.filter(
    (snippet) =>
      snippet.title.toLowerCase().includes(query) ||
      snippet.content.toLowerCase().includes(query),
  );
}
