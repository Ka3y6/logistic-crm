import React, { useState, useEffect, useRef } from 'react';

// Стили можно вынести в отдельный CSS файл или использовать CSS-in-JS
const styles = {
    chatContainer: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        height: '500px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        zIndex: 1000, // Чтобы был поверх других элементов
    },
    header: {
        padding: '10px',
        backgroundColor: '#f1f1f1',
        borderBottom: '1px solid #ccc',
        textAlign: 'center',
        fontWeight: 'bold',
        borderRadius: '8px 8px 0 0',
    },
    messagesContainer: {
        flexGrow: 1,
        padding: '10px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    message: {
        maxWidth: '80%',
        padding: '8px 12px',
        borderRadius: '18px',
        marginBottom: '10px',
        wordWrap: 'break-word',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007bff',
        color: 'white',
    },
    assistantMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e9e9eb',
        color: 'black',
    },
    inputArea: {
        display: 'flex',
        padding: '10px',
        borderTop: '1px solid #ccc',
    },
    input: {
        flexGrow: 1,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '18px',
        marginRight: '8px',
    },
    button: {
        padding: '8px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '18px',
        cursor: 'pointer',
    },
    toggleButton: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        border: 'none',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 999, // Чуть ниже чата, если чат открыт
    }
};

function AIAssistantChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'assistant', text: 'Привет! Чем могу помочь?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleInputChange = (event) => {
        setQuery(event.target.value);
    };

    // Функция для получения CSRF токена из cookie (пример)
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    const handleSendMessage = async () => {
        if (!query.trim()) return;

        const userMessage = query;
        const newMessages = [...messages, { sender: 'user', text: userMessage }];
        setMessages(newMessages);
        setQuery('');
        setIsLoading(true);

        try {
            const headers = {
                'Content-Type': 'application/json',
            };

            // Используем TokenAuthentication
            const drfToken = localStorage.getItem('token');
            if (drfToken) {
                headers['Authorization'] = `Token ${drfToken}`;
            } else {
                console.warn('DRF Auth token not found. AI Assistant query might fail if endpoint is protected.');
                setMessages(prevMessages => [...prevMessages, { 
                    sender: 'assistant', 
                    text: 'Ошибка авторизации. Пожалуйста, войдите в систему.' 
                }]);
                setIsLoading(false);
                return;
            }

            console.log('Sending request to AI Assistant:', {
                url: 'ai-assistant/query/',
                headers: headers,
                body: {
                    message: userMessage,
                    history: messages.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    }))
                }
            });

            const response = await fetch('ai-assistant/query/', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                    message: userMessage,
                    history: messages.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    }))
                })
            });

            console.log('AI Assistant response:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (readError) {
                    console.error("[AIAssistantChat] Failed to read error response text:", readError);
                    throw new Error(`HTTP error! status: ${response.status}. Failed to read error response body.`);
                }

                let errorDetail = errorText;
                try {
                    const errorData = JSON.parse(errorText);
                    if (typeof errorData === 'object' && errorData !== null) {
                        errorDetail = errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData);
                    } else if (typeof errorData === 'string') {
                        errorDetail = errorData;
                    }
                } catch (parseError) {
                    // Если не удалось распарсить JSON, используем исходный текст
                }

                if (response.status === 401) {
                    errorDetail = "Ошибка авторизации. Пожалуйста, убедитесь, что вы вошли в систему.";
                }
                throw new Error(errorDetail);
            }

            const data = await response.json();
            const assistantText = (typeof data.message === 'string') ? data.message : "Ответ не получен или имеет неверный формат.";
            setMessages(prevMessages => [...prevMessages, { sender: 'assistant', text: assistantText }]);
        } catch (error) {
            console.error("Ошибка при отправке запроса к AI ассистенту:", error);
            setMessages(prevMessages => [...prevMessages, { sender: 'assistant', text: `Ошибка: ${error.message}` }]);
        }
        setIsLoading(false);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !isLoading) {
            handleSendMessage();
        }
    };

    if (!isOpen) {
        return (
            <button style={styles.toggleButton} onClick={() => setIsOpen(true)}>
                <span>&#129302;</span> {/* Иконка робота */} 
            </button>
        );
    }

    return (
        <div style={styles.chatContainer}>
            <div style={styles.header}>
                Виртуальный помощник
                <button onClick={() => setIsOpen(false)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>X</button>
            </div>
            <div style={styles.messagesContainer}>
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        style={{
                            ...styles.message, 
                            ...(msg.sender === 'user' ? styles.userMessage : styles.assistantMessage)
                        }}
                    >
                        {msg.text}
                    </div>
                ))}
                {isLoading && (
                    <div style={{ ...styles.message, ...styles.assistantMessage }}>
                        <i>Печатает...</i>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputArea}>
                <input 
                    type="text" 
                    value={query} 
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress} 
                    style={styles.input}
                    placeholder="Спросите что-нибудь..."
                    disabled={isLoading}
                />
                <button onClick={handleSendMessage} style={styles.button} disabled={isLoading}>
                    Отправить
                </button>
            </div>
        </div>
    );
}

export default AIAssistantChat; 