## Build stage: install all deps and compile both Nest apps
FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

## Runtime stage: production deps only + compiled output
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY start.sh ./start.sh
RUN chmod +x start.sh && mkdir -p uploads

EXPOSE 3000
CMD ["./start.sh"]
