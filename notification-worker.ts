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

const MAX_NOTIFCATIONS_TO_KEEP = 100;

await sub.subscribe("notifications", async (message) => {
  const { userId, text, type } = JSON.parse(message);
  const key = `notifications:${userId}`;
  const notification = {
    text,
    type,
  };
  await store.lPush(key, JSON.stringify(notification));
  await store.lTrim(key, 0, MAX_NOTIFCATIONS_TO_KEEP - 1);
});
