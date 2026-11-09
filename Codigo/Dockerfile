# Imagen de la API de Vendix (Node.js).
#   docker build -t vendix-api .
# o, junto con MySQL:   docker compose --profile completo up -d --build
FROM node:20-alpine

WORKDIR /app

# primero solo las dependencias (así Docker reutiliza esta capa si no cambian)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY src ./src
COPY scripts ./scripts
COPY database ./database

ENV NODE_ENV=production
EXPOSE 3000

# el proceso no corre como administrador dentro del contenedor
USER node

CMD ["node", "src/server.js"]
