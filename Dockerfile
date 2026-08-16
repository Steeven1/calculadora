# ===== ETAPA 1: BUILD =====
#crear image con node,alpine y usarlo para la etapa del build
FROM node:20-alpine as build
#crear directorio de trabajo, luego se mueve automaticamente al directorio de trabajo
#es como usar mkdir app y luego usar cd app
WORKDIR /usr/src/calculadora-frontend
#copiar configuracion de dependencias de la app
COPY package*.json ./
#npm ci->clean install
RUN npm ci
#copiamos todo de la máquina fisica en el directorio actual al contenedor
COPY . .
#ejectar comando npm para generar el minificado de la app, se generar un directorio (dist)
RUN npm run build

# ===== ETAPA 2: PRODUCCIÓN CON NGINX =====
#for production -> nginxinc/nginx-unprivileged:stable-alpine
FROM nginxinc/nginx-unprivileged:stable-alpine
#crear usuario con privilegios minimos
#RUN addgroup -S app && adduser -S app -G app
#crear directorio de trabajo
WORKDIR /usr/src/calculadora-frontend
# (Opcional pero recomendado) Copiar configuración personalizada de Nginx
# Esto es crucial si tu app es una SPA (React, Vue, Angular)
COPY --from=build --chown=app:app  /usr/src/calculadora-frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos compilados desde la etapa 'build'
# hacia el directorio público por defecto de Nginx
COPY --from=build --chown=app:app /usr/src/calculadora-frontend/dist /usr/share/nginx/html

#COPIAR node_modules
#COPY --from=build --chown=app:app /usr/src/calculadora-frontend/node_modules ./node_modules

#usar usuario app
#USER app

# Exponer el puerto 80 (puerto estándar HTTP de Nginx)
EXPOSE 8080

# Iniciar Nginx en primer plano (la imagen oficial ya sabe cómo hacerlo, 
# pero es buena práctica definirlo)
CMD ["nginx", "-g", "daemon off;"]