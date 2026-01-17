# Multi-stage Dockerfile for React Frontend

# Stage 1: Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code (includes src/assets/logos/ and public/logos/)
# Logo files in src/assets/ will be processed by Vite during build
# Logo files in public/ will be copied as-is to build output
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
