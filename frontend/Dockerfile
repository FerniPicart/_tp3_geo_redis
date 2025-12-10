# Imagen base ligera de Node
FROM node:24

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

ARG NEXT_PUBLIC_API_BASE=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# Copiar el resto y construir
COPY . .
RUN npm run build

EXPOSE 3000

# Variable por defecto apuntando al backend en el host
ENV PORT=3000
ENV NEXT_PUBLIC_API_BASE=http://localhost:8000

# Ejecutar la app en modo producción
CMD ["npm", "run", "start"]

