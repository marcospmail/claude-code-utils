/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Claude CLI Path - Custom path to the Claude CLI binary (leave empty for auto-detection) */
  "claudeCliPath"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `create-snippet` command */
  export type CreateSnippet = ExtensionPreferences & {}
  /** Preferences accessible in the `browse-snippets` command */
  export type BrowseSnippets = ExtensionPreferences & {}
  /** Preferences accessible in the `received-messages` command */
  export type ReceivedMessages = ExtensionPreferences & {}
  /** Preferences accessible in the `sent-messages` command */
  export type SentMessages = ExtensionPreferences & {}
  /** Preferences accessible in the `cheatsheet` command */
  export type Cheatsheet = ExtensionPreferences & {}
  /** Preferences accessible in the `browse-agents` command */
  export type BrowseAgents = ExtensionPreferences & {}
  /** Preferences accessible in the `browse-commands` command */
  export type BrowseCommands = ExtensionPreferences & {}
  /** Preferences accessible in the `changelog` command */
  export type Changelog = ExtensionPreferences & {}
  /** Preferences accessible in the `search-sessions` command */
  export type SearchSessions = ExtensionPreferences & {}
  /** Preferences accessible in the `prompt-library` command */
  export type PromptLibrary = ExtensionPreferences & {}
  /** Preferences accessible in the `transform-selection` command */
  export type TransformSelection = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `create-snippet` command */
  export type CreateSnippet = {}
  /** Arguments passed to the `browse-snippets` command */
  export type BrowseSnippets = {}
  /** Arguments passed to the `received-messages` command */
  export type ReceivedMessages = {}
  /** Arguments passed to the `sent-messages` command */
  export type SentMessages = {}
  /** Arguments passed to the `cheatsheet` command */
  export type Cheatsheet = {}
  /** Arguments passed to the `browse-agents` command */
  export type BrowseAgents = {}
  /** Arguments passed to the `browse-commands` command */
  export type BrowseCommands = {}
  /** Arguments passed to the `changelog` command */
  export type Changelog = {}
  /** Arguments passed to the `search-sessions` command */
  export type SearchSessions = {}
  /** Arguments passed to the `prompt-library` command */
  export type PromptLibrary = {}
  /** Arguments passed to the `transform-selection` command */
  export type TransformSelection = {}
}

