import dotenv from "dotenv";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

function errorLog(context: string, err: unknown) {
  console.error(`[${context}]`, err);
}

const sub = createClient({
  username: "default",
  password: process.env.REDIS_TOKEN,
  socket: {
    host: process.env.REDIS_HOST || "",
    port: Number(process.env.REDIS_PORT) || 31714,
  },
});

const store = createClient({
  username: "default",
  password: process.env.REDIS_TOKEN,
  socket: {
    host: process.env.REDIS_HOST || "",
    port: Number(process.env.REDIS_PORT) || 31714,
  },
});

try {
  await sub.connect();
} catch (err) {
  errorLog("sub.connect", err);
  process.exit(1);
}

try {
  await store.connect();
} catch (err) {
  errorLog("store.connect", err);
  process.exit(1);
}

export const NotificationType = {
  GOAL_PROGRESS: "GOAL_PROGRESS",
  GENERAL: "GENERAL",
  STREAK: "STREAK",
  GLOBAL: "GLOBAL",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

const MAX_NOTIFICATIONS_TO_KEEP = 5;
const GLOBAL_EXPIRE_SECONDS = 60 * 60 * 24; // 1 day

await sub.subscribe("notifications", async (message) => {
  try {
    const { userId, text, type } = JSON.parse(message);

    const notificationGlobal = { text, type, id: uuidv4() };
    if (type === NotificationType.GLOBAL) {
      const globalKey = `notifications:global`;
      await store.lPush(globalKey, JSON.stringify(notificationGlobal));
      await store.lTrim(globalKey, 0, MAX_NOTIFICATIONS_TO_KEEP - 1);
      await store.expire(globalKey, GLOBAL_EXPIRE_SECONDS);
      return;
    }

    const notificationUser = { text, type };
    if (userId) {
      const userKey = `notifications:${userId}`;
      await store.lPush(userKey, JSON.stringify(notificationUser));
      await store.lTrim(userKey, 0, MAX_NOTIFICATIONS_TO_KEEP - 1);
      return;
    }
  } catch (error) {
    errorLog("sub.subscribe handler", error);
  }
});

process.on("SIGINT", async () => {
  try {
    await sub.quit();
    await store.quit();
  } catch (error) {
    errorLog("SIGINT", error);
  } finally {
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  try {
    await sub.quit();
    await store.quit();
  } catch (error) {
    errorLog("SIGTERM", error);
  } finally {
    process.exit(0);
  }
});
