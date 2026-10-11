# Production Dockerfile for GhostDOM
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for cached layer
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY . .

# Expose server port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
