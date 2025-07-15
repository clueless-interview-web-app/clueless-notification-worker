import dotenv from "dotenv";
import { createClient } from "redis";

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

await sub.subscribe("notifications", async (message) => {
  const { userId, text, type } = JSON.parse(message);
  const notification = { text, type };

  if (type === "GLOBAL") {
    const globalKey = `notifications:global`;
    await store.lPush(globalKey, JSON.stringify(notification));
    await store.lTrim(globalKey, 0, MAX_NOTIFICATIONS_TO_KEEP - 1);
    return;
  }

  if (userId) {
    const userKey = `notifications:${userId}`;
    await store.lPush(userKey, JSON.stringify(notification));
    await store.lTrim(userKey, 0, MAX_NOTIFICATIONS_TO_KEEP - 1);
    return;
  }
});
