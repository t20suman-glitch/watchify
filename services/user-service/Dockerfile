FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY proto ./proto
COPY src ./src

EXPOSE 50051 3001

CMD ["node", "src/index.js"]
