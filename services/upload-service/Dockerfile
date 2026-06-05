FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY proto ./proto
COPY src ./src
RUN mkdir -p uploads

EXPOSE 50052 3002

VOLUME ["/app/uploads"]

CMD ["npm", "start"]
