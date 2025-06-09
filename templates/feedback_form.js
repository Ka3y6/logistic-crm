// Функция для отправки формы обратной связи
async function submitFeedbackForm(event) {
    event.preventDefault();
    
    // Получаем данные формы
    const form = event.target;
    const formData = {
        name: form.querySelector('[name="name"]').value,
        phone: form.querySelector('[name="phone"]').value,
        email: form.querySelector('[name="email"]').value,
        comment: form.querySelector('[name="comment"]').value
    };

    try {
        // Отправляем данные на API
        const response = await fetch('https://crm.greatline.by/api/site-requests/submit-feedback/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            // Показываем сообщение об успехе
            showMessage('success', 'Спасибо! Ваша заявка успешно отправлена.');
            form.reset();
        } else {
            // Показываем ошибку
            showMessage('error', result.message || 'Произошла ошибка при отправке заявки.');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showMessage('error', 'Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
    }
}

// Функция для отображения сообщений
function showMessage(type, message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `feedback-message ${type}`;
    messageDiv.textContent = message;
    
    // Добавляем сообщение на страницу
    const form = document.querySelector('#feedback-form');
    form.parentNode.insertBefore(messageDiv, form.nextSibling);
    
    // Удаляем сообщение через 5 секунд
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Добавляем обработчик события для формы
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#feedback-form');
    if (form) {
        form.addEventListener('submit', submitFeedbackForm);
    }
}); 