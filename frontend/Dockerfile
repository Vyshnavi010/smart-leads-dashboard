# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Custom nginx config to support client-side routing (React Router) if needed,
# but a default config is fine for basic serving, or we can copy a custom nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
