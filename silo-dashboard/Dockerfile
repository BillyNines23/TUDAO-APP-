FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

RUN npx vite build && npx esbuild server/index.prod.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "dist/index.js"]