import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { Skill, getSkills } from "../../utils/skill";
import SkillDetail from "./detail";

export default function BrowseSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSkills() {
      try {
        const loaded = await getSkills();
        setSkills(loaded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load skills");
      } finally {
        setIsLoading(false);
      }
    }

    loadSkills();
  }, []);

  if (error) {
    return (
      <List>
        <List.EmptyView icon={Icon.ExclamationMark} title="Error Loading Skills" description={error} />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Browse skills...">
      {skills.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Skills Found"
          description="No skill files found in ~/.claude/skills"
        />
      ) : (
        skills.map((skill) => (
          <List.Item
            key={skill.id}
            title={skill.name}
            subtitle={skill.description}
            icon={Icon.Wand}
            accessories={skill.model ? [{ tag: skill.model }] : []}
            actions={
              <ActionPanel>
                <Action.Push title="View Skill Details" icon={Icon.Eye} target={<SkillDetail skill={skill} />} />
                <Action.CopyToClipboard
                  title="Copy to Clipboard"
                  content={skill.content}
                  icon={Icon.Clipboard}
                  shortcut={{ modifiers: ["cmd"], key: "enter" }}
                />
                <Action.CopyToClipboard
                  title="Copy Path"
                  content={skill.filePath}
                  icon={Icon.Link}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                />
                <Action.ShowInFinder path={skill.filePath} shortcut={{ modifiers: ["cmd", "shift"], key: "f" }} />
                <Action.OpenWith path={skill.filePath} shortcut={{ modifiers: ["cmd"], key: "o" }} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
