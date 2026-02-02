# Multi-stage Dockerfile for React Frontend
# Note: Using lightweight static file server instead of nginx
# External nginx will handle reverse proxying

# Stage 1: Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Copy source code (includes src/assets/logos/ and public/logos/)
# Logo files in src/assets/ will be processed by Vite during build
# Logo files in public/ will be copied as-is to build output
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage - Lightweight static file server
FROM node:20-alpine

# Install serve globally (lightweight static file server)
RUN npm install -g serve

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/build /app/build

# Expose port 80 (external nginx will proxy to this)
EXPOSE 80

# Start serve on port 80
# -s flag: serve single-page application (SPA) mode (handles client-side routing)
# -l 80: listen on port 80
CMD ["serve", "-s", "build", "-l", "80"]
