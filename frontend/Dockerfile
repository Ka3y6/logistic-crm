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

# Сборка приложения с увеличенным лимитом памяти
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Установка serve для раздачи статики
RUN npm install -g serve

# Запуск приложения
CMD ["serve", "-s", "build", "-l", "3000"] 