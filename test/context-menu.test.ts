import { describe, expect, it } from "vitest";
import {
  contextMenuEntries,
  type ContextMenuEntry,
  type ContextMenuTarget,
  type EditFlags,
} from "../src/window/context-menu";

const flags = (over: Partial<EditFlags> = {}): EditFlags => ({
  canUndo: false,
  canRedo: false,
  canCut: false,
  canCopy: false,
  canPaste: false,
  canDelete: false,
  canSelectAll: false,
  canEditRichly: false,
  ...over,
});

const target = (over: Partial<ContextMenuTarget> = {}): ContextMenuTarget => ({
  linkURL: "",
  srcURL: "",
  mediaType: "none",
  hasImageContents: false,
  isEditable: false,
  misspelledWord: "",
  dictionarySuggestions: [],
  editFlags: flags(),
  ...over,
});

function commands(entries: ContextMenuEntry[]): string[] {
  return entries.map((entry) => {
    if (entry.kind === "separator") return "|";
    if (entry.kind === "suggestion") return `suggest:${entry.word}`;
    return entry.text ? `${entry.command}:${entry.text}` : entry.command;
  });
}

describe("context menu", () => {
  it("offers cut, copy, paste, and select all on a non-editable page", () => {
    const entries = contextMenuEntries(
      target({ editFlags: flags({ canCopy: true, canSelectAll: true }) }),
    );
    expect(commands(entries)).toEqual(["cut", "copy", "paste", "|", "select-all"]);
    expect(entries.find((entry) => entry.kind === "command" && entry.command === "copy")).toMatchObject({
      enabled: true,
    });
    expect(entries.find((entry) => entry.kind === "command" && entry.command === "paste")).toMatchObject({
      enabled: false,
    });
    expect(entries.find((entry) => entry.kind === "command" && entry.command === "select-all")).toMatchObject({
      enabled: true,
    });
  });

  it("offers undo, redo, delete, and paste-and-match-style in an editable field", () => {
    const entries = contextMenuEntries(
      target({
        isEditable: true,
        editFlags: flags({
          canUndo: true,
          canCut: true,
          canCopy: true,
          canPaste: true,
          canDelete: true,
          canSelectAll: true,
          canEditRichly: true,
        }),
      }),
    );
    expect(commands(entries)).toEqual([
      "undo",
      "redo",
      "|",
      "cut",
      "copy",
      "paste",
      "paste-and-match-style",
      "delete",
      "|",
      "select-all",
    ]);
    expect(entries.find((entry) => entry.kind === "command" && entry.command === "redo")).toMatchObject({
      enabled: false,
    });
  });

  it("hides paste-and-match-style when the field is not rich text", () => {
    const entries = contextMenuEntries(
      target({ isEditable: true, editFlags: flags({ canPaste: true }) }),
    );
    expect(commands(entries)).not.toContain("paste-and-match-style");
  });

  it("opens a grok link in a new tab and copies an external link address", () => {
    expect(commands(contextMenuEntries(target({ linkURL: "https://grok.com/chat/abc" })))).toEqual([
      "open-link-tab:https://grok.com/chat/abc",
      "copy-link:https://grok.com/chat/abc",
      "|",
      "cut",
      "copy",
      "paste",
      "|",
      "select-all",
    ]);
    expect(commands(contextMenuEntries(target({ linkURL: "https://example.com/docs" })))[0]).toBe(
      "open-link-external:https://example.com/docs",
    );
    expect(commands(contextMenuEntries(target({ linkURL: "javascript:alert(1)" })))).toEqual([
      "cut",
      "copy",
      "paste",
      "|",
      "select-all",
    ]);
  });

  it("copies an image and its address", () => {
    expect(
      commands(
        contextMenuEntries(
          target({
            mediaType: "image",
            hasImageContents: true,
            srcURL: "https://assets.grok.com/pic.png",
          }),
        ),
      ).slice(0, 2),
    ).toEqual(["copy-image", "copy-image-address:https://assets.grok.com/pic.png"]);
  });

  it("lists spelling suggestions before the edit commands", () => {
    expect(
      commands(
        contextMenuEntries(
          target({
            isEditable: true,
            misspelledWord: "teh",
            dictionarySuggestions: ["the", "ten"],
          }),
        ),
      ).slice(0, 4),
    ).toEqual(["suggest:the", "suggest:ten", "add-to-dictionary:teh", "|"]);
  });
});
