/**
 * Utility functions for formatting markdown content in detail views
 */

/**
 * Formats content with a title and wraps it in a markdown code block
 * @param title - The title to display as an h1 heading
 * @param content - The content to display in a markdown code block
 * @returns Formatted markdown string
 */
export function formatContentMarkdown(title: string, content: string): string {
  return `
# ${title}

\`\`\`markdown
${content}
\`\`\`
  `;
}
