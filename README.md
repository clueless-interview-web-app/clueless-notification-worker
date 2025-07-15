# Clueless Notification Worker

## Requirements
- Node.js 18+
- Redis instance (host, port, and token required)
- Environment variables in `.env` file:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `REDIS_TOKEN`

## Install dependencies
```
npm install
```

## Run locally
```
npm start
```

## Deploy
- Use a Node.js 18+ environment
- Ensure `.env` is set with correct Redis credentials
- Use `npm start` to launch the worker
