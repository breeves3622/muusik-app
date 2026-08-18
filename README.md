# Muusik.app - Portainer Stack & Discord Bot Setup

Self-hosted **Muusik.app** Discord Music Bot and SvelteKit Web Dashboard deployment configuration for **Portainer**.

---

## 🏗️ Architecture

```
                               ┌────────────────────────────────┐
                               │       Discord API & Voice      │
                               └───────────────▲────────────────┘
                                               │
                                               │ (Voice / Slash Commands)
                                               ▼
┌─────────────────────────┐         ┌───────────────────────────┐
│   Muusik Web Dashboard  │────────►│   Muusik API & Bot Engine │
│     (SvelteKit / 5173)  │◄────────│      (Hono / Node 8000)   │
└────────────┬────────────┘         └───────────────────────────┘
             │
             │ (Auth & Session Data)
             ▼
┌─────────────────────────┐
│     Supabase Project    │
│  (Discord OAuth & DB)   │
└─────────────────────────┘
```

- **`muusik-api`**: Node.js & Hono backend running `discord.js` and `discord-player` with `ffmpeg` audio extraction.
- **`muusik-web`**: SvelteKit web dashboard for interactive server queue management, music playback control, and playlists.

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Discord Developer Portal Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**. Name it **Muusik** (or your preferred bot name).
2. Go to the **Bot** tab on the left sidebar:
   - Click **Reset Token** and save your **`DISCORD_BOT_TOKEN`**.
   - Under **Privileged Gateway Intents**, enable:
     - ✅ **Presence Intent**
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
3. Go to the **OAuth2** tab:
   - Copy your **`CLIENT ID`** (this is `DISCORD_CLIENT_ID`).
   - Copy your **`CLIENT SECRET`** (needed for Supabase Discord auth).
4. **Generate Bot Invite Link**:
   - In **OAuth2** -> **URL Generator**:
   - Scopes: Select `bot` and `applications.commands`.
   - Bot Permissions: Select `Send Messages`, `Connect`, `Speak`, `Use Slash Commands`, `Read Message History`.
   - Copy the generated URL to invite the bot to your Discord servers.

---

### Step 2: Supabase Auth & Database Setup

1. Create a free project at [Supabase](https://supabase.com).
2. In Supabase Dashboard -> **Project Settings** -> **API**:
   - Copy **Project URL** (`PUBLIC_SUPABASE_URL`).
   - Copy **anon / public key** (`PUBLIC_SUPABASE_ANON_KEY`).
   - Copy **service_role key** (`PRIVATE_SUPABASE_SERVICE_ROLE`).
3. In Supabase Dashboard -> **Authentication** -> **Providers**:
   - Enable **Discord**.
   - Input your Discord Application **Client ID** and **Client Secret**.
   - Copy the **Redirect URL** provided by Supabase (e.g. `https://<project-id>.supabase.co/auth/v1/callback`) and paste it into Discord Developer Portal under **OAuth2** -> **Redirects**.

---

### Step 3: Register Discord Slash Commands

Run the slash command registration script once so Discord registers `/play`, `/skip`, etc.:

```bash
cd api
export TOKEN=your_discord_bot_token
export CLIENT_ID=your_discord_client_id
npm run registerCommands
```

---

### Step 4: Deploying to Portainer

1. Log into your **Portainer** instance.
2. Navigate to **Stacks** -> **Add stack**.
3. Choose **Repository** build method:
   - **Repository URL**: `https://github.com/breeves3622/muusik-app`
   - **Repository reference**: `refs/heads/main` or `main`
   - **Compose path**: `docker-compose.yml`
4. Under **Environment variables**, click **Add environment variable** or paste from `.env.example`:

| Variable Name | Example Value | Description |
|---|---|---|
| `DISCORD_BOT_TOKEN` | `MTI...` | Discord Bot Token |
| `DISCORD_CLIENT_ID` | `1137...` | Discord Client ID |
| `FRONTEND_ORIGIN` | `http://SERVER_IP:5173` | Public URL of Web Dashboard |
| `PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Anon API Key |
| `PRIVATE_SUPABASE_SERVICE_ROLE` | `eyJ...` | Supabase Service Role Key |
| `API_PORT` | `8000` | Host Port for API |
| `WEB_PORT` | `5173` | Host Port for Web Dashboard |

5. Click **Deploy the stack**.

---

## 🎮 Interacting with Music

- **Discord Server**: Join a voice channel in your Discord server and type `/play <song or url>`.
- **Web Dashboard**: Open `http://YOUR_SERVER_IP:5173` in your web browser, log in with Discord, select your server, and control playback live!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
