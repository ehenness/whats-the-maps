# Builds the Node.js app image used by Docker Compose.
FROM node:20-bookworm-slim

WORKDIR /app

# Install dependencies first so Docker can reuse this layer between rebuilds.
COPY package*.json ./
RUN npm ci

# Copy the application source after dependencies are installed.
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
