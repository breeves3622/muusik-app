# Multi-stage Dockerfile for muusik-web (SvelteKit)
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci --include=dev --legacy-peer-deps

COPY . .

# Build-time environment variables for SvelteKit static public & private imports
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY
ARG PRIVATE_SUPABASE_SERVICE_ROLE

ENV PUBLIC_SUPABASE_URL=${PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}
ENV PUBLIC_SUPABASE_ANON_KEY=${PUBLIC_SUPABASE_ANON_KEY:-placeholder-anon-key}
ENV PRIVATE_SUPABASE_SERVICE_ROLE=${PRIVATE_SUPABASE_SERVICE_ROLE:-placeholder-service-role}

# Ensure .env exists with default fallback values during vite build
RUN cp .env.example .env 2>/dev/null || echo -e "PUBLIC_SUPABASE_URL=https://placeholder.supabase.co\nPUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key\nPRIVATE_SUPABASE_SERVICE_ROLE=placeholder-service-role" > .env

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
