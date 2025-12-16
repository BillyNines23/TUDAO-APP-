# Stage 1: Build the Application
FROM node:20-slim AS builder

WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Install dependencies (Includes dev dependencies needed for the build script)
RUN npm install

# 3. Copy source code (including vite.config.js, client/ folder, etc.)
COPY . .

# 4. Run the build script. This step is where the previous error occurred.
# If this succeeds, it creates 'dist/index.js' and 'dist/public'
RUN npm run build


# Stage 2: Create the Final Production Image (Lightweight)
FROM node:20-slim AS runner

WORKDIR /app

# 1. Copy ONLY the compiled server entry point and client assets from the builder stage
# Server entry point:
COPY --from=builder /app/dist/index.js ./dist/index.js
# Client assets folder (Vite output defined as 'dist/public' in your config):
COPY --from=builder /app/dist/public ./dist/public

# 2. Copy package.json and install ONLY production dependencies
COPY package*.json ./
RUN npm install --omit=dev

ENV PORT 8080
EXPOSE 8080

# Start the application
CMD [ "npm", "run", "start" ]