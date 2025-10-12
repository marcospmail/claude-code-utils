import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useState } from "react";
import {
  CommandItem,
  getCommandsByCategory,
  searchCommands,
} from "../../constants/commands-data";
import CommandDetail from "./detail";

export default function BrowseCommandsCheatsheet() {
  const [searchText, setSearchText] = useState("");
  const commandsByCategory = getCommandsByCategory();
  const filteredCommands = searchText ? searchCommands(searchText) : [];

  const getIconForCommand = (command: CommandItem): Icon => {
    const iconMap: Record<string, Icon> = {
      ["Commands"]: Icon.Terminal,
      ["Keyboard Shortcuts"]: Icon.Keyboard,
      ["CLI Flags"]: Icon.Flag,
      ["Special Keywords"]: Icon.Stars,
      ["Configuration Commands"]: Icon.Code,
    };

    const icon = iconMap[command.category];

    if (icon) {
      return icon;
    }

    return Icon.Code;
  };

  return (
    <List
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Claude Code commands..."
      filtering={false}
    >
      {searchText ? (
        <List.Section title={`Search Results (${filteredCommands.length})`}>
          {filteredCommands.map((command) => (
            <List.Item
              key={command.id}
              title={command.name}
              subtitle={command.description}
              icon={getIconForCommand(command)}
              accessories={[{ text: command.category }]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Details"
                    target={<CommandDetail command={command} />}
                    icon={Icon.Eye}
                  />
                  <Action.CopyToClipboard
                    title="Copy Command"
                    content={command.name}
                    icon={Icon.Clipboard}
                  />
                  {command.usage && (
                    <Action.CopyToClipboard
                      title="Copy Usage"
                      content={command.usage}
                      icon={Icon.Code}
                    />
                  )}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : (
        commandsByCategory.map(({ category, commands }) => (
          <List.Section
            key={category}
            title={`${category} (${commands.length})`}
          >
            {commands.map((command) => (
              <List.Item
                key={command.id}
                title={command.name}
                subtitle={command.description}
                icon={getIconForCommand(command)}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="View Details"
                      target={<CommandDetail command={command} />}
                      icon={Icon.Eye}
                    />
                    <Action.CopyToClipboard
                      title="Copy Command"
                      content={command.name}
                      icon={Icon.Clipboard}
                    />
                    {command.usage && (
                      <Action.CopyToClipboard
                        title="Copy Usage"
                        content={command.usage}
                        icon={Icon.Code}
                      />
                    )}
                  </ActionPanel>
                }
              />
            ))}
          </List.Section>
        ))
      )}
    </List>
  );
}
