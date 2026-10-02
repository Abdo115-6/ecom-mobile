FROM node:20-alpine AS build
RUN apk add --no-cache git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
RUN apk add --no-cache git
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/dist ./dist
RUN mkdir -p public/data public/uploads data/wa-session
EXPOSE 3000
CMD ["node", "server.js"]
