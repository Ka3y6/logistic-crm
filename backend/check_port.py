import socket
import sys

def check_port(host, port):
    try:
        # Создаем сокет
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # Устанавливаем таймаут
        sock.settimeout(5)
        # Пробуем подключиться
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"Порт {port} открыт на {host}")
        else:
            print(f"Порт {port} закрыт на {host}")
            print(f"Код ошибки: {result}")
        sock.close()
    except socket.gaierror:
        print(f"Ошибка DNS для {host}")
    except socket.error as e:
        print(f"Ошибка при проверке порта: {e}")

if __name__ == "__main__":
    # Проверяем оба варианта - доменное имя и IP
    hosts = ["s2.open.by", "93.84.119.237"]
    port = 3306
    
    for host in hosts:
        print(f"\nПроверяем подключение к {host}:{port}")
        check_port(host, port) 