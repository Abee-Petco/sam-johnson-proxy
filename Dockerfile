
FROM node:14

WORKDIR /Users/samjohnson/Documents/hrfiles/petco/nick-proxy-server

COPY package.json ./

RUN npm install

COPY ./ ./