/**
 * Utility functions for generating formatted markdown content for detail views
 */

interface FileContentMarkdownOptions {
  name: string;
  content: string;
}

/**
 * Generates formatted markdown for file content detail pages
 * Used in agent and slash command detail views
 */
export function generateFileContentMarkdown(
  options: FileContentMarkdownOptions,
): string {
  const { name, content } = options;

  const sections: string[] = [];

  // Title
  sections.push(`# ${name}`);
  sections.push("");

  // Content in markdown code block
  sections.push("```markdown");
  sections.push(content);
  sections.push("```");

  return sections.join("\n");
}
