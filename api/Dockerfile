# Multi-stage Dockerfile for muusik-api
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies required for native audio modules & ffmpeg
RUN apk add --no-cache python3 make g++ git ffmpeg

COPY package*.json ./
RUN npm ci

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
# Keep full dependencies as discord.js and discord-player are in devDependencies
RUN npm ci

COPY --from=builder /app/build ./build
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/commands.json ./commands.json

EXPOSE 8000

CMD ["node", "build/index.js"]
