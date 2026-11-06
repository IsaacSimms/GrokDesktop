import type { Session } from "electron";
import { decidePermission } from "./decide";

export function installPermissions(ses: Session): void {
  const allow = (_webContents: unknown, permission: string): boolean => decidePermission(permission);
  ses.setPermissionCheckHandler(allow);
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(decidePermission(permission));
  });
}
