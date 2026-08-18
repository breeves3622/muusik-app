# 🎵 Vocard Discord Music Bot Stack

High-performance, self-hosted Discord Music Bot with **Lavalink v4**, **Spotify-Tokener**, **MongoDB**, and **Web Dashboard**.

---

## 📁 Repository Structure

```
├── docker-compose.yml
├── README.md
├── lavalink/
│   └── application.yml
├── vocard/
│   └── settings.json
└── dashboard/
    └── settings.json
```

---

## ⚙️ Configuration Setup

### 1. `vocard/settings.json`
- `"token"`: Your Discord Bot Token.
- `"client_id"`: `1539295351675162745` (numeric).
- `"client_secret"`: Your Discord Client Secret.

### 2. `dashboard/settings.json`
- `"client_id"`: `1539295351675162745`
- `"client_secret"`: Your Discord Client Secret.
- `"redirect_uri"`: `http://YOUR_SERVER_IP:8080/auth/callback`

### 3. Discord Developer Portal OAuth2 Redirect
1. Open [Discord Developer Portal](https://discord.com/developers/applications) -> Select Application `1539295351675162745`.
2. Go to **OAuth2** -> **Redirects**.
3. Add `http://YOUR_SERVER_IP:8080/auth/callback`.
4. Click **Save Changes**.

---

## 🚀 Portainer Deployment

1. Go to Portainer -> **Stacks** -> **Add Stack**.
2. Name: `vocard`
3. Repository URL: `https://github.com/breeves3622/muusik-app`
4. Click **Deploy the stack**!
