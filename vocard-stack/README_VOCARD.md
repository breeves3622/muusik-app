# 🎵 Vocard + Lavalink + Dashboard Stack Setup Guide

This stack provides a complete, high-performance **Vocard Music Bot** with **Lavalink**, **Spotify Tokener**, **MongoDB**, and **Web Dashboard**.

---

## 📁 Directory Structure

Create directory `/opt/vocard` on your server and place the files:

```
/opt/vocard/
├── docker-compose.yml
├── lavalink/
│   └── application.yml
├── vocard/
│   └── settings.json
├── dashboard/
│   └── settings.json
└── data/
    └── mongo/
```

---

## ⚙️ Configuration Setup

### 1. `vocard/settings.json`
- Set `"token"` to your Discord Bot Token.
- Set `"client_id"` to `1539295351675162745` (numeric).
- Set `"client_secret"` to your Discord Client Secret from the Developer Portal.

### 2. `dashboard/settings.json`
- Set `"client_id"` and `"client_secret"`.
- Set `"redirect_uri"` to `http://YOUR_SERVER_IP:8080/auth/callback`.
- Set `"secret_key"` to any random secure string.

### 3. Discord Developer Portal OAuth2 Redirect
1. Open [Discord Developer Portal](https://discord.com/developers/applications) -> Select your bot.
2. Go to **OAuth2** -> **Redirects**.
3. Add `http://YOUR_SERVER_IP:8080/auth/callback`.
4. Click **Save Changes**.

---

## 🚀 Deployment via Portainer

1. Go to Portainer -> **Stacks** -> **Add Stack**.
2. Name it **vocard**.
3. Paste the contents of `docker-compose.yml` (or deploy from repository).
4. Click **Deploy the stack**.

---

## 🎉 Verification
- **Lavalink Status**: Check container logs for `Lavalink is ready to accept connections`.
- **Bot Response**: Try `/play` or `v!play` in Discord.
- **Dashboard**: Access `http://YOUR_SERVER_IP:8080` in your browser.
