FROM node:10

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Configure environment
ENV NODE_CONFIG_DIR=/app/dist/config

# Install dependencies
COPY package.json /app
RUN npm install

# Compile app
COPY src/ /app/src
COPY config/ /app/config
COPY .babelrc /app/
RUN npm run build

EXPOSE 3000

CMD ["node", "/app/dist/server/main.js"]
