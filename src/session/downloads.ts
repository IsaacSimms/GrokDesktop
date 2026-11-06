import { app, type Session } from "electron";
import fs from "fs";
import { downloadFilePath } from "./download-path";

export function installDownloads(ses: Session): void {
  ses.on("will-download", (_event, item) => {
    const directory = app.getPath("downloads");
    item.setSavePath(
      downloadFilePath(directory, item.getFilename(), (candidate) => fs.existsSync(candidate)),
    );
  });
}
