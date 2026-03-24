import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { PasteAction } from "../../components/paste-action";
import { Skill } from "../../utils/skill";
import { formatCodeBlock } from "../../utils/markdown-formatter";

interface SkillDetailProps {
  skill: Skill;
}

export default function SkillDetail({ skill }: SkillDetailProps) {
  const markdown = formatCodeBlock(skill.content);

  const metadata: { title: string; value: string }[] = [];
  if (skill.model) metadata.push({ title: "Model", value: skill.model });
  if (skill.context) metadata.push({ title: "Context", value: skill.context });
  if (skill.allowedTools) metadata.push({ title: "Allowed Tools", value: skill.allowedTools });

  return (
    <Detail
      markdown={markdown}
      navigationTitle={skill.name}
      metadata={
        metadata.length > 0 ? (
          <Detail.Metadata>
            {metadata.map((m) => (
              <Detail.Metadata.Label key={m.title} title={m.title} text={m.value} />
            ))}
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <PasteAction content={"/" + skill.name} />
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
  );
}
