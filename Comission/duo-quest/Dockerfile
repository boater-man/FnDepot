# Stage 1: Build frontend
FROM node:20-alpine AS frontend

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy frontend package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --prefer-offline --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN pnpm run build

# Stage 2: Build and run server
FROM node:20-alpine AS server

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache sqlite python3 make g++

# Copy server package files
COPY server/package.json ./

# Install dependencies using npm (better native module support)
RUN npm install --production

# Copy server source
COPY server/index.js ./

# Create necessary directories
RUN mkdir -p public uploads data

# Copy built frontend to public folder
COPY --from=frontend /app/dist ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "index.js"]
