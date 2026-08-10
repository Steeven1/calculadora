# ===== ETAPA 1: BUILD =====
FROM node:20-alpine as build
WORKDIR /usr/src/calculadora-frontend

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== ETAPA 2: PRODUCCIÓN =====
FROM node:20-alpine
WORKDIR /usr/src/calculadora-frontend

# Copiar solo los archivos necesarios para instalar dependencias de producción
COPY package*.json ./

# Instalar SOLO dependencias de producción (sin devDependencies)
RUN npm ci --omit=dev

# Copiar el código compilado desde la etapa build
COPY --from=build /usr/src/calculadora-frontend/dist ./dist

ENV PORT=3000
EXPOSE 3000

# Crear usuario sin privilegios
RUN addgroup -g 1001 -S calculadora-frontend && \
    adduser -u 1001 -S calculadora-frontend -G calculadora-frontend

# Dar permisos al directorio
RUN chown -R calculadora-frontend:calculadora-frontend /usr/src/calculadora-frontend

# Cambiar a usuario sin privilegios
USER calculadora-frontend

ENV NODE_ENV=production
CMD ["npm", "start"]