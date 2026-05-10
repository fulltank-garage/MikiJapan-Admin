# MikiJapan Admin

Admin web app for reviewing member applications, managing approved members, receiving realtime updates, and enabling web push notifications.

## Stack

- Vite + React + TypeScript
- Tailwind CSS via `@tailwindcss/vite`
- Axios for API requests
- WebSocket plus polling fallback for realtime application updates
- PWA manifest and service worker for Home Screen usage

## Requirements

Use Node.js 24.x.

```bash
npm install
npm run dev
npm run build
```

## Environment

```bash
VITE_API_BASE_URL=https://<api-domain>/api
```

The API must expose:

```text
POST /api/auth/login
GET  /api/member-applications
GET  /api/members
GET  /api/members/events
GET  /api/push-notifications/public-key
POST /api/push-notifications/subscriptions
```

## Realtime Behavior

The app keeps the pending-application badge live through WebSocket events and falls back to polling when the connection is interrupted. The mobile Home Screen menu shows the last sync time and includes a manual refresh button for cases where iOS/Android suspends the app in the background.
