# Partme - P2P Live Streaming

Real-time peer-to-peer video streaming built with Next.js, WebRTC, and Cloudflare Workers.

## Architecture

- **Frontend**: Next.js 14 (App Router) deployed on Vercel
- **Signaling**: PartyServer on Cloudflare Workers Free Tier
- **Video/Audio**: Peer-to-Peer WebRTC (browser-to-browser)
- **STUN**: `stun.cloudflare.com:3478` (free & unlimited)
- **Auth**: Email verification via Gmail SMTP

## How It Works

1. **Streamer** clicks "Go Live" - camera is captured, WebRTC offer is generated
2. **Signaling** - the offer routes through a free Cloudflare Worker (tiny text only)
3. **Viewers** join the room, receive the offer, create a direct P2P connection
4. **Stream** flows browser-to-browser. No time limits. No bills. No middleman.

## Getting Started

```bash
cd partme
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

- `SMTP_EMAIL` - Gmail address for sending verification emails
- `SMTP_APP_PASSWORD` - Gmail App Password
- `JWT_SECRET` - Secret key for JWT tokens
- `NEXT_PUBLIC_PARTY_HOST` - Your Cloudflare Worker URL
- `NEXT_PUBLIC_APP_URL` - Your app URL

## Deploy Signaling Server

```bash
npx wrangler deploy
```

## Deploy Frontend

```bash
npx vercel --prod
```

## Tech Stack

- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- WebRTC (native RTCPeerConnection)
- Cloudflare Workers (signaling)
- Nodemailer (Gmail SMTP)
- JWT Authentication
