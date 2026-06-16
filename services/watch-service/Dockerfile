FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY proto ./proto
COPY src ./src

EXPOSE 50053 3003

CMD ["node", "src/index.js"]
