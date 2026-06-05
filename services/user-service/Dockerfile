FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY proto ./proto
COPY src ./src

EXPOSE 50051 3001

CMD ["npm", "start"]
