# Multi-stage Dockerfile for muusik-web (SvelteKit)
FROM node:20-alpine AS builder

WORKDIR /app

# Ensure devDependencies (vite, svelte-kit, adapters) are installed even if NODE_ENV is set to production
ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci --include=dev --legacy-peer-deps

COPY . .

# Build-time environment variables for SvelteKit static public imports
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ENV PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}
ENV PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY:-placeholder-anon-key}

RUN npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5173

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY --from=builder /app/build ./build

EXPOSE 5173

CMD ["node", "build/index.js"]
