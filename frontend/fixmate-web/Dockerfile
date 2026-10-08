# ── FixMate Web Dockerfile ─────────────────────────────────────────────────────
# Stage 1: Build the React app
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS final
COPY --from=build /app/dist /usr/share/nginx/html
# SPA routing: redirect all 404s to index.html so React Router works
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
