FROM node:18-alpine

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование проекта
COPY . .

# Сборка приложения
RUN npm run build

# Установка serve для раздачи статики
RUN npm install -g serve

# Запуск приложения
CMD ["serve", "-s", "build", "-l", "3000"] 