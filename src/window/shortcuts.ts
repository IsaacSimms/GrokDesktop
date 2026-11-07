export type KeyInput = {
  type: string;
  key: string;
  control: boolean;
  alt: boolean;
  meta: boolean;
  shift: boolean;
};

export type Shortcut = "open-tab" | "close-tab" | "previous-tab" | "next-tab";

export function shortcutFor(input: KeyInput): Shortcut | null {
  if (input.type !== "keyDown" || !input.control || input.alt || input.meta || input.shift) {
    return null;
  }
  const key = input.key.toLowerCase();
  if (key === "t") return "open-tab";
  if (key === "w") return "close-tab";
  if (key === "arrowleft") return "previous-tab";
  if (key === "arrowright") return "next-tab";
  return null;
}
