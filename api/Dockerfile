# Multi-stage Dockerfile for muusik-api
FROM node:20-alpine AS builder

WORKDIR /app

# Ensure devDependencies (typescript, discord.js, etc.) are installed even if NODE_ENV is set to production
ENV NODE_ENV=development

# Install build dependencies required for native audio modules & ffmpeg
RUN apk add --no-cache python3 make g++ git ffmpeg

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime ffmpeg for Discord audio streaming
RUN apk add --no-cache ffmpeg python3

ENV NODE_ENV=production
ENV PORT=8000

COPY package*.json ./
# Install dependencies (discord.js & discord-player are in devDependencies in api/package.json)
RUN npm ci --include=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/commands.json ./commands.json

EXPOSE 8000

CMD ["node", "build/index.js"]
