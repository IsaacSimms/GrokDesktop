export type CaptureState = "idle" | "selecting";

export type ActivateDecision = {
  state: CaptureState;
  action: "start" | "ignore";
};

export function onActivate(state: CaptureState): ActivateDecision {
  if (state === "selecting") return { state, action: "ignore" };
  return { state: "selecting", action: "start" };
}

export type Shot =
  | { kind: "cancel" }
  | { kind: "error" }
  | { kind: "image"; png: Buffer };

export type ShotDecision = {
  state: "idle";
  action: "noop" | "log" | "paste";
};

export function onShot(shot: Shot): ShotDecision {
  if (shot.kind === "cancel") return { state: "idle", action: "noop" };
  if (shot.kind === "error" || shot.png.length === 0) return { state: "idle", action: "log" };
  return { state: "idle", action: "paste" };
}
