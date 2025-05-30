# Этап сборки
FROM node:18-alpine

WORKDIR /app

# Установка дополнительных зависимостей
RUN apk add --no-cache python3 make g++

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование проекта
COPY . .

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"] 