import { app, session, type Session } from "electron";
import { PERSIST_PARTITION } from "./partition";
import { CHROME_USER_AGENT } from "./user-agent";

export function configureSession(): Session {
  const ses = session.fromPartition(PERSIST_PARTITION);
  ses.setUserAgent(CHROME_USER_AGENT);
  app.userAgentFallback = CHROME_USER_AGENT;
  return ses;
}
