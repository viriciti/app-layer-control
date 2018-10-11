FROM node:8

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY node_modules /app/node_modules
COPY dist/server  /app/server
COPY dist/client  /app/client
COPY config/      /app/config

# Create required directories
RUN mkdir -p /app/server/sources/external

EXPOSE 3000

CMD ["node", "/app/server/main.js"]
