# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app

# Установка дополнительных зависимостей
RUN apk add --no-cache python3 make g++

# Копирование только файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование только исходного кода
COPY . .

# Сборка приложения
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Проверка наличия собранных файлов
RUN ls -la build/static

# Этап production
FROM nginx:alpine

# Копирование собранного приложения
COPY --from=builder /app/build /usr/share/nginx/html

# Проверка наличия файлов
RUN ls -la /usr/share/nginx/html/static

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открытие порта
EXPOSE 80

# Запуск nginx
CMD ["nginx", "-g", "daemon off;"] 