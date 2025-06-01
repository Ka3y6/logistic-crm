import mysql.connector
from mysql.connector import Error
import socket

def test_connection():
    # Сначала проверим DNS
    try:
        print(f"Проверка DNS для s2.open.by...")
        ip_address = socket.gethostbyname('s2.open.by')
        print(f"IP адрес сервера: {ip_address}")
    except socket.gaierror as e:
        print(f"Ошибка DNS: {e}")
        return

    # Пробуем подключиться
    try:
        print("\nПробуем подключиться к базе данных...")
        connection = mysql.connector.connect(
            host='93.84.119.237',  # Используем IP вместо доменного имени
            database='greatlineby_crm',
            user='greatlineby_root',
            password='c64s6KPa!',  # Новый пароль
            port=3306,
            connect_timeout=10,
            use_pure=True,
            auth_plugin='mysql_native_password'  # Явно указываем метод аутентификации
        )
        
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"Успешное подключение к MySQL/MariaDB. Версия сервера: {db_info}")
            
            cursor = connection.cursor()
            cursor.execute("SELECT DATABASE();")
            database = cursor.fetchone()
            print(f"Подключено к базе данных: {database[0]}")
            
            # Проверяем права пользователя
            cursor.execute("SHOW GRANTS FOR CURRENT_USER;")
            grants = cursor.fetchall()
            print("\nПрава пользователя:")
            for grant in grants:
                print(grant[0])
            
            cursor.close()
            connection.close()
            print("\nСоединение с MySQL закрыто")
            
    except Error as e:
        print(f"Ошибка при подключении к MySQL: {e}")
        print("\nВозможные причины:")
        print("1. Сервер базы данных недоступен")
        print("2. Порт 3306 закрыт")
        print("3. Неправильные учетные данные")
        print("4. Проблемы с сетевым подключением")
        print("\nРекомендации:")
        print("1. Проверьте, что сервер s2.open.by доступен")
        print("2. Убедитесь, что порт 3306 открыт")
        print("3. Проверьте правильность учетных данных")
        print("4. Проверьте настройки файрвола")
        print("5. Проверьте, что ваш IP адрес разрешен для доступа к базе данных")

if __name__ == "__main__":
    test_connection() 