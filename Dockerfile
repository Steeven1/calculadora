# ===== ETAPA 1: BUILD =====
FROM node:20-alpine as build
WORKDIR /usr/src/calculadora-frontend

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== ETAPA 2: PRODUCCIÓN CON NGINX =====
FROM nginx:stable-alpine

# (Opcional pero recomendado) Copiar configuración personalizada de Nginx
# Esto es crucial si tu app es una SPA (React, Vue, Angular)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos compilados desde la etapa 'build'
# hacia el directorio público por defecto de Nginx
COPY --from=build /usr/src/calculadora-frontend/dist /usr/share/nginx/html

# Exponer el puerto 80 (puerto estándar HTTP de Nginx)
EXPOSE 80

# Iniciar Nginx en primer plano (la imagen oficial ya sabe cómo hacerlo, 
# pero es buena práctica definirlo)
CMD ["nginx", "-g", "daemon off;"]