import {
  Action,
  ActionPanel,
  Alert,
  Clipboard,
  confirmAlert,
  Form,
  getSelectedText,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  DEFAULT_MODEL,
  DEFAULT_OUTPUT,
  deleteTransform,
  EFFORT_LEVELS_BY_MODEL,
  generateTransformId,
  getTransforms,
  saveTransform,
  Transform,
  TransformEffort,
  TransformModel,
  TransformOutput,
} from "../../utils/transform";
import TransformExecute from "./execute";

const ICON_OPTIONS: Array<{ name: string; icon: Icon }> = [
  { name: "AppWindowGrid3x3", icon: Icon.AppWindowGrid3x3 },
  { name: "Bolt", icon: Icon.Bolt },
  { name: "Book", icon: Icon.Book },
  { name: "Bug", icon: Icon.Bug },
  { name: "CheckCircle", icon: Icon.CheckCircle },
  { name: "CodeBlock", icon: Icon.CodeBlock },
  { name: "Eye", icon: Icon.Eye },
  { name: "Gauge", icon: Icon.Gauge },
  { name: "MagnifyingGlass", icon: Icon.MagnifyingGlass },
  { name: "Pencil", icon: Icon.Pencil },
  { name: "SpeechBubble", icon: Icon.SpeechBubble },
  { name: "Star", icon: Icon.Star },
  { name: "Switch", icon: Icon.Switch },
  { name: "Tag", icon: Icon.Tag },
  { name: "Text", icon: Icon.Text },
  { name: "Wand", icon: Icon.Wand },
];

function resolveIcon(name: string): Icon {
  return ICON_OPTIONS.find((o) => o.name === name)?.icon ?? Icon.Bolt;
}

const MODEL_OPTIONS: Array<{ value: TransformModel; label: string }> = [
  { value: "haiku", label: "Haiku (fast)" },
  { value: "sonnet", label: "Sonnet (balanced)" },
  { value: "opus", label: "Opus (powerful)" },
];

const EFFORT_LABEL: Record<TransformEffort, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra High",
  max: "Max",
};

const OUTPUT_OPTIONS: Array<{ value: TransformOutput; label: string }> = [
  { value: "show", label: "Show result" },
  { value: "replace", label: "Replace selection" },
];

// Guards against corrupt/legacy storage: returns effort only if valid for the model.
function validEffortForModel(model: TransformModel, effort: TransformEffort | undefined): TransformEffort | undefined {
  if (!effort) return undefined;
  return (EFFORT_LEVELS_BY_MODEL[model] as string[]).includes(effort) ? effort : undefined;
}

interface TransformFormValues {
  title: string;
  description: string;
  icon: string;
  prompt: string;
  model: string;
  effort: string;
  output: string;
  copyToClipboard: boolean;
}

function TransformForm({ initial, onSave }: { initial?: Transform; onSave: (transform: Transform) => Promise<void> }) {
  const { pop } = useNavigation();
  const [selectedModel, setSelectedModel] = useState<TransformModel>(initial?.model ?? DEFAULT_MODEL);
  const [selectedEffort, setSelectedEffort] = useState<string>(() => {
    const effort = initial?.effort ?? "";
    return (EFFORT_LEVELS_BY_MODEL[initial?.model ?? DEFAULT_MODEL] as string[]).includes(effort) ? effort : "";
  });

  function handleModelChange(newModel: string) {
    const model = newModel as TransformModel;
    setSelectedModel(model);
    if (selectedEffort && !(EFFORT_LEVELS_BY_MODEL[model] as string[]).includes(selectedEffort)) {
      setSelectedEffort("");
    }
  }

  async function handleSubmit(values: TransformFormValues) {
    const hasPlaceholder = values.prompt.includes("{{selection}}") || values.prompt.includes("{{clipboard}}");
    if (!hasPlaceholder) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid prompt",
        message: "Prompt must contain {{selection}} or {{clipboard}}",
      });
      return;
    }
    const transform: Transform = {
      id: initial?.id ?? generateTransformId(values.title),
      title: values.title,
      description: values.description,
      icon: values.icon,
      prompt: values.prompt,
      model: selectedModel,
      effort: selectedEffort ? (selectedEffort as TransformEffort) : undefined,
      output: values.output as TransformOutput,
      copyToClipboard: values.copyToClipboard,
      requiresVariable: initial?.requiresVariable,
    };
    await onSave(transform);
    pop();
  }

  return (
    <Form
      navigationTitle={initial ? "Edit Transform" : "Create Transform"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" defaultValue={initial?.title ?? ""} />
      <Form.TextField id="description" title="Description" defaultValue={initial?.description ?? ""} />
      <Form.Dropdown id="icon" title="Icon" defaultValue={initial?.icon ?? "Bolt"}>
        {ICON_OPTIONS.map((o) => (
          <Form.Dropdown.Item key={o.name} value={o.name} title={o.name} icon={o.icon} />
        ))}
      </Form.Dropdown>
      <Form.TextArea
        id="prompt"
        title="Prompt"
        placeholder="Use {{selection}} for selected text or {{clipboard}} for clipboard content"
        defaultValue={initial?.prompt ?? ""}
      />
      <Form.Dropdown id="output" title="Output" defaultValue={initial?.output ?? DEFAULT_OUTPUT}>
        {OUTPUT_OPTIONS.map((o) => (
          <Form.Dropdown.Item key={o.value} value={o.value} title={o.label} />
        ))}
      </Form.Dropdown>
      <Form.Checkbox
        id="copyToClipboard"
        title="Clipboard"
        label="Also copy result to clipboard"
        defaultValue={initial?.copyToClipboard ?? false}
      />

      <Form.Dropdown id="model" title="Model" value={selectedModel} onChange={handleModelChange}>
        {MODEL_OPTIONS.map((o) => (
          <Form.Dropdown.Item key={o.value} value={o.value} title={o.label} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="effort" title="Effort" value={selectedEffort} onChange={setSelectedEffort}>
        <Form.Dropdown.Item value="" title="Default" />
        {EFFORT_LEVELS_BY_MODEL[selectedModel].map((level) => (
          <Form.Dropdown.Item key={level} value={level} title={EFFORT_LABEL[level]} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

// LanguageSelectForm: pushed when running a requiresVariable transform.
// sel and clip are pre-read at click time by the parent's Run onAction.
function LanguageSelectForm({ transform, sel, clip }: { transform: Transform; sel: string; clip: string }) {
  const { push } = useNavigation();
  return (
    <Form
      navigationTitle="Select Target Language"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Convert"
            onSubmit={(values: { language: string }) =>
              push(
                <TransformExecute
                  transformName={`${transform.title} → ${values.language}`}
                  prompt={transform.prompt
                    .replaceAll("{{language}}", values.language)
                    .replaceAll("{{selection}}", sel)
                    .replaceAll("{{clipboard}}", clip)}
                  output={transform.output ?? DEFAULT_OUTPUT}
                  copyToClipboard={transform.copyToClipboard ?? false}
                  model={transform.model}
                  effort={validEffortForModel(transform.model, transform.effort)}
                />,
              )
            }
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="language" title="Target Language" defaultValue={transform.requiresVariable!.options[0]}>
        {transform.requiresVariable!.options.map((lang) => (
          <Form.Dropdown.Item key={lang} value={lang} title={lang} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}

export default function TransformSelection() {
  const { push } = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [transforms, setTransforms] = useState<Transform[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    async function loadData() {
      setTransforms(await getTransforms());
      setIsLoading(false);
    }
    loadData();
  }, [refresh]);

  function reload() {
    setRefresh((r) => r + 1);
  }

  // runAction: reads selected text and clipboard FRESH at click time so stale
  // state can never be used. Validates that required inputs are present before pushing.
  function runAction(transform: Transform) {
    if (transform.requiresVariable) {
      return (
        <Action
          title="Run Transform"
          icon={Icon.Play}
          onAction={async () => {
            let sel = "";
            try {
              sel = await getSelectedText();
            } catch {
              /* no selection */
            }
            if (transform.prompt.includes("{{selection}}") && !sel) {
              await showToast({
                style: Toast.Style.Failure,
                title: "No text selected",
                message: "Select text first",
              });
              return;
            }
            const clip = transform.prompt.includes("{{clipboard}}") ? ((await Clipboard.readText()) ?? "") : "";
            push(<LanguageSelectForm transform={transform} sel={sel} clip={clip} />);
          }}
        />
      );
    }
    return (
      <Action
        title="Run Transform"
        icon={Icon.Play}
        onAction={async () => {
          let sel = "";
          if (transform.prompt.includes("{{selection}}")) {
            try {
              sel = await getSelectedText();
            } catch {
              /* no selection */
            }
            if (!sel) {
              await showToast({
                style: Toast.Style.Failure,
                title: "No text selected",
                message: "Select text first",
              });
              return;
            }
          }
          const clip = transform.prompt.includes("{{clipboard}}") ? ((await Clipboard.readText()) ?? "") : "";
          const finalPrompt = transform.prompt.replaceAll("{{selection}}", sel).replaceAll("{{clipboard}}", clip);
          push(
            <TransformExecute
              transformName={transform.title}
              prompt={finalPrompt}
              output={transform.output ?? DEFAULT_OUTPUT}
              copyToClipboard={transform.copyToClipboard ?? false}
              model={transform.model}
              effort={validEffortForModel(transform.model, transform.effort)}
            />,
          );
        }}
      />
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search transforms...">
      <List.Section title="Transforms" subtitle={`${transforms.length} transform${transforms.length === 1 ? "" : "s"}`}>
        {transforms.map((transform) => (
          <List.Item
            key={transform.id}
            title={transform.title}
            subtitle={transform.description}
            icon={resolveIcon(transform.icon)}
            actions={
              <ActionPanel>
                {runAction(transform)}
                <Action.Push
                  title="Create Transform"
                  icon={Icon.Plus}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                  target={
                    <TransformForm
                      onSave={async (t) => {
                        await saveTransform(t);
                        reload();
                      }}
                    />
                  }
                />
                <Action.Push
                  title="Edit Transform"
                  icon={Icon.Pencil}
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                  target={
                    <TransformForm
                      initial={transform}
                      onSave={async (updated) => {
                        await saveTransform(updated);
                        reload();
                      }}
                    />
                  }
                />
                <Action
                  title="Delete Transform"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["ctrl"], key: "x" }}
                  onAction={async () => {
                    const confirmed = await confirmAlert({
                      title: `Delete "${transform.title}"?`,
                      message: "This can't be undone.",
                      primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
                    });
                    if (!confirmed) return;
                    await deleteTransform(transform.id);
                    await showToast({ style: Toast.Style.Success, title: "Transform deleted" });
                    reload();
                  }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
