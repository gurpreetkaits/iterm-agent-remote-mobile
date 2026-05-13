# iterm-agent-remote

Monitor and control AI coding agent sessions running in iTerm2 from your phone.

A FastAPI server bridges to iTerm2 on your Mac and exposes session state over HTTP/WebSocket. An Expo (React Native) mobile app connects to it so you can see what your agents are doing and send input remotely.

## Requirements

- macOS with iTerm2 (with the Python API enabled: `iTerm2 → Settings → General → Magic → Enable Python API`)
- Python 3.12+
- Node.js 20+ and `npx`
- Expo Go on your phone (for the mobile client)

## Setup

```bash
git clone git@github.com:<your-user>/iterm-agent-remote.git
cd iterm-agent-remote
./setup.sh
```

`setup.sh` creates a Python venv, installs deps for both server and mobile, and generates a random API token written to `server/.env`. Save the token — you'll paste it into the mobile app on first launch.

## Running

**Server** (on the Mac running iTerm2):
```bash
cd server
source .venv/bin/activate
python run.py
```
Server listens on `0.0.0.0:8420` by default.

**Mobile app:**
```bash
cd mobile
npx expo start
```
Scan the QR code with Expo Go. On first launch, enter your Mac's LAN IP, port `8420`, and the API token from `server/.env`. Phone and Mac must be on the same network.

## Layout

- `server/` — FastAPI app, iTerm2 bridge, process scanner
- `mobile/` — Expo Router app (TypeScript)

## Configuration

Server env vars (in `server/.env`):
- `DASHBOARD_API_TOKEN` — shared secret for the mobile client
- `DASHBOARD_HOST` — bind address (default `0.0.0.0`)
- `DASHBOARD_PORT` — port (default `8420`)
