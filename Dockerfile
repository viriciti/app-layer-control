# STAGE 1: build
FROM node:10 as builder

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install dependencies
COPY package.json /app
RUN npm install

# Compile app
COPY src/ /app/src
COPY config/ /app/config
COPY .babelrc /app/
RUN npm run build

# STAGE 2: run
FROM node:10-slim as run

# Configure environment
ENV NODE_CONFIG_DIR=/app/dist/config

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

EXPOSE 3000

WORKDIR /app

CMD ["node", "/app/dist/server/main.js"]
