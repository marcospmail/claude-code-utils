import { Action, ActionPanel, Alert, Color, confirmAlert, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { deleteCustomPrompt, getAllPrompts, PromptTemplate } from "../../utils/prompts";
import CreatePromptForm from "./create-form";
import PromptDetail from "./detail";
import VariableForm from "./variable-form";
import ExecutePromptView from "./execute";

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  async function loadPrompts() {
    setIsLoading(true);
    try {
      const all = await getAllPrompts();
      setPrompts(all);
    } catch (err) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load prompts", message: String(err) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPrompts();
  }, []);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return prompts;
    const q = searchText.toLowerCase();
    return prompts.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [prompts, searchText]);

  const grouped = useMemo(() => {
    const groups: Record<string, PromptTemplate[]> = {};
    for (const p of filtered) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  async function handleDelete(prompt: PromptTemplate) {
    const confirmed = await confirmAlert({
      title: "Delete Prompt",
      message: `Are you sure you want to delete "${prompt.name}"?`,
      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;
    await deleteCustomPrompt(prompt.id);
    showToast({ style: Toast.Style.Success, title: "Prompt deleted" });
    loadPrompts();
  }

  function runAction(prompt: PromptTemplate) {
    if (prompt.variables.length > 0) {
      return <VariableForm prompt={prompt} />;
    }
    return (
      <ExecutePromptView
        promptId={prompt.id}
        promptName={prompt.name}
        fullPrompt={prompt.prompt}
        model={prompt.model}
      />
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search prompts..." onSearchTextChange={setSearchText}>
      {grouped.map(([category, categoryPrompts]) => (
        <List.Section key={category} title={category} subtitle={String(categoryPrompts.length)}>
          {categoryPrompts.map((prompt) => (
            <List.Item
              key={prompt.id}
              title={prompt.name}
              subtitle={prompt.description}
              icon={Icon.Terminal}
              accessories={[
                ...(prompt.usageCount > 0 ? [{ text: String(prompt.usageCount), icon: Icon.ArrowClockwise }] : []),
                ...(prompt.model ? [{ tag: { value: prompt.model, color: Color.Purple } }] : []),
                { tag: { value: prompt.category, color: Color.Blue } },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push title="Run Prompt" icon={Icon.Play} target={runAction(prompt)} />
                  <Action.Push title="View Details" icon={Icon.Eye} target={<PromptDetail prompt={prompt} />} />
                  <Action.Push
                    title="Create Custom Prompt"
                    icon={Icon.Plus}
                    shortcut={{ modifiers: ["cmd"], key: "n" }}
                    target={<CreatePromptForm />}
                  />
                  {!prompt.isBuiltIn && (
                    <Action
                      title="Delete Prompt"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ["ctrl"], key: "x" }}
                      onAction={() => handleDelete(prompt)}
                    />
                  )}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
