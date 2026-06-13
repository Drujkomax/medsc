# Express API (TypeScript, run via tsx). For Contabo / any Docker host.
FROM node:20-slim
WORKDIR /app

# Install ALL deps (tsx is a devDependency and is needed at runtime).
COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=6001
EXPOSE 6001

# File storage lives on a mounted volume (see docker-compose.prod.yml).
ENV STORAGE_DIR=/app/_storage

CMD ["npm", "start"]
