FROM node:20-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update -y && apt-get install -y openssl

# Increase memory for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy root config
COPY package.json turbo.json ./

# Copy all workspaces
COPY packages ./packages
COPY apps ./apps

# Install all dependencies (hoisted)
# Remove lockfile to avoid windows path issues
RUN rm -f package-lock.json packages/*/package-lock.json apps/*/package-lock.json
RUN npm install

# Build server
RUN npx turbo run build --filter=server...

# Create user
USER node

EXPOSE 3001
CMD ["node", "apps/server/dist/index.js"]
