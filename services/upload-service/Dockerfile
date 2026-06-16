FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY proto ./proto
COPY src ./src
RUN mkdir -p uploads

EXPOSE 50052 3002

VOLUME ["/app/uploads"]

CMD ["node", "src/index.js"]
