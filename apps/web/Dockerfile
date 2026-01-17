# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN rm -f package-lock.json packages/*/package-lock.json apps/*/package-lock.json
RUN npm install
RUN npx turbo run build --filter=web...

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Custom Nginx Config
RUN printf 'server {\n\
    listen 80;\n\
    location / {\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
    proxy_pass http://flowwave-server:3001/api/;\n\
    proxy_set_header Host $host;\n\
    }\n\
    location /health {\n\
    proxy_pass http://flowwave-server:3001/health;\n\
    proxy_set_header Host $host;\n\
    }\n\
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
