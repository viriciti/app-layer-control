FROM node:10

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY node_modules /app/node_modules
COPY dist/server  /app/server
COPY dist/client  /app/client
COPY dist/config  /app/config
COPY package.json /app

EXPOSE 3000

ARG GITLAB_ACCESS_TOKEN=xxx
ENV GITLAB_ACCESS_TOKEN=${GITLAB_ACCESS_TOKEN}

CMD ["node", "/app/server/main.js"]
