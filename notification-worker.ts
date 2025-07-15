import dotenv from "dotenv";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

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

await sub.connect();
await store.connect();

const MAX_NOTIFICATIONS_TO_KEEP = 5;
const GLOBAL_EXPIRE_SECONDS = 60 * 60 * 24; // 1 day

await sub.subscribe("notifications", async (message) => {
  const { userId, text, type } = JSON.parse(message);

  const notificationGlobal = { text, type, id: uuidv4() };
  if (type === "GLOBAL") {
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
});
