import { classifyLink, openableExternalUrl } from "../links/classify";

export type EditFlags = {
  canUndo: boolean;
  canRedo: boolean;
  canCut: boolean;
  canCopy: boolean;
  canPaste: boolean;
  canDelete: boolean;
  canSelectAll: boolean;
  canEditRichly: boolean;
};

export type ContextMenuTarget = {
  linkURL: string;
  srcURL: string;
  mediaType: string;
  hasImageContents: boolean;
  isEditable: boolean;
  misspelledWord: string;
  dictionarySuggestions: readonly string[];
  editFlags: EditFlags;
};

export type ContextCommand =
  | "undo"
  | "redo"
  | "cut"
  | "copy"
  | "paste"
  | "paste-and-match-style"
  | "delete"
  | "select-all"
  | "copy-link"
  | "open-link-tab"
  | "open-link-external"
  | "copy-image"
  | "copy-image-address"
  | "add-to-dictionary";

export type ContextMenuEntry =
  | { kind: "separator" }
  | { kind: "suggestion"; label: string; word: string }
  | { kind: "command"; command: ContextCommand; label: string; enabled: boolean; text?: string };

function command(
  commandId: ContextCommand,
  label: string,
  enabled: boolean,
  text?: string,
): ContextMenuEntry {
  return text === undefined
    ? { kind: "command", command: commandId, label, enabled }
    : { kind: "command", command: commandId, label, enabled, text };
}

function spellSection(input: ContextMenuTarget): ContextMenuEntry[] {
  const word = input.misspelledWord.trim();
  if (!word) return [];
  const suggestions = input.dictionarySuggestions
    .map((suggestion) => suggestion.trim())
    .filter((suggestion) => suggestion.length > 0)
    .map((suggestion) => ({ kind: "suggestion" as const, label: suggestion, word: suggestion }));
  return [...suggestions, command("add-to-dictionary", "Add to Dictionary", true, word)];
}

function linkSection(input: ContextMenuTarget): ContextMenuEntry[] {
  const url = openableExternalUrl(input.linkURL);
  if (!url) return [];
  const decision = classifyLink({ kind: "window-open", url, popup: false });
  const items: ContextMenuEntry[] = [];
  if (decision === "new-tab") {
    items.push(command("open-link-tab", "Open Link in New Tab", true, url));
  } else if (decision === "external") {
    items.push(command("open-link-external", "Open Link in Browser", true, url));
  }
  items.push(command("copy-link", "Copy Link Address", true, url));
  return items;
}

function imageSection(input: ContextMenuTarget): ContextMenuEntry[] {
  if (input.mediaType !== "image") return [];
  const items: ContextMenuEntry[] = [];
  if (input.hasImageContents) items.push(command("copy-image", "Copy Image", true));
  const src = openableExternalUrl(input.srcURL);
  if (src) items.push(command("copy-image-address", "Copy Image Address", true, src));
  return items;
}

function editSection(input: ContextMenuTarget): ContextMenuEntry[] {
  const flags = input.editFlags;
  const items: ContextMenuEntry[] = [];
  if (input.isEditable) {
    items.push(
      command("undo", "Undo", flags.canUndo),
      command("redo", "Redo", flags.canRedo),
      { kind: "separator" },
    );
  }
  items.push(
    command("cut", "Cut", flags.canCut),
    command("copy", "Copy", flags.canCopy),
    command("paste", "Paste", flags.canPaste),
  );
  if (input.isEditable && flags.canEditRichly) {
    items.push(command("paste-and-match-style", "Paste and Match Style", flags.canPaste));
  }
  if (input.isEditable) items.push(command("delete", "Delete", flags.canDelete));
  items.push({ kind: "separator" }, command("select-all", "Select All", flags.canSelectAll));
  return items;
}

function joinSections(sections: ContextMenuEntry[][]): ContextMenuEntry[] {
  const present = sections.filter((section) => section.length > 0);
  const items: ContextMenuEntry[] = [];
  present.forEach((section, index) => {
    if (index > 0) items.push({ kind: "separator" });
    items.push(...section);
  });
  return items;
}

export function contextMenuEntries(input: ContextMenuTarget): ContextMenuEntry[] {
  return joinSections([
    spellSection(input),
    linkSection(input),
    imageSection(input),
    editSection(input),
  ]);
}
