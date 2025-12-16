# Stage 1: Build the Application
FROM node:20-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies, including dev dependencies needed for the build
RUN npm install

# Copy the rest of the application code
COPY . .

# Run the build script
RUN npm run build


# Stage 2: Create the Final Production Image (Lightweight)
FROM node:20-slim AS runner

# Set the working directory
WORKDIR /app

# Copy only the compiled code and production dependencies from the builder stage
COPY --from=builder /app/dist ./dist
# Re-run npm install without dev dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Set the port that Cloud Run expects
ENV PORT 8080

# The Cloud Run container must listen on $PORT
EXPOSE 8080

# Start the application using the production start script
CMD [ "npm", "run", "start" ]