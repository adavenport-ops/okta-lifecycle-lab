# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:5001
ARG VITE_SSE_URL=http://localhost:5001/events
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SSE_URL=$VITE_SSE_URL

RUN npm run build

# Production stage — lightweight static server
FROM node:20-slim

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
