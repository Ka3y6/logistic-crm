# Этап 1: Сборка React-приложения
FROM node:18-alpine as builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (или yarn.lock)
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код приложения
COPY . .

# Собираем приложение
RUN npm run build # Если у вас другая команда, измените здесь

# Этап 2: Обслуживание с помощью Nginx
FROM nginx:1.25-alpine

# Копируем собранные статические файлы из этапа сборки
COPY --from=builder /app/build /usr/share/nginx/html

# (Опционально) Копируем кастомную конфигурацию Nginx, если она нужна
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80 (Nginx по умолчанию слушает этот порт)
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"] 