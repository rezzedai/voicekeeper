FROM node:20-slim AS build

WORKDIR /app

# Build voicekeeper library
COPY package.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

# Build API server
COPY api/package.json ./api/
RUN cd api && npm install
COPY api/src/ ./api/src/
COPY api/tsconfig.json ./api/
RUN cd api && npx tsc

FROM node:20-slim

WORKDIR /app

# Copy voicekeeper compiled output
COPY --from=build /app/dist/ ./dist/

# Copy API compiled output and dependencies
COPY --from=build /app/api/dist/ ./api/dist/
COPY --from=build /app/api/node_modules/ ./api/node_modules/
COPY --from=build /app/api/package.json ./api/

# Copy static files
COPY api/openapi.json ./api/
COPY api/privacy-policy.md ./api/

WORKDIR /app/api

EXPOSE 8080

CMD ["node", "dist/server.js"]
