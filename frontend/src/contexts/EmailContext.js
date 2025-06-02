import React, { createContext, useState, useContext, useCallback } from 'react';

// Создаем контекст
const EmailContext = createContext();

// Создаем провайдер контекста
export const EmailProvider = ({ children }) => {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', content: '' });

  const openComposeModal = useCallback((initialData = {}) => {
    // Устанавливаем начальные данные, если они переданы (например, 'to' email)
    setComposeData({
      to: initialData.to || '',
      subject: initialData.subject || '',
      content: initialData.content || '',
      // Можно добавить и другие поля, например, для ответа/пересылки
      replyToEmail: initialData.replyToEmail || null, 
      forwardEmail: initialData.forwardEmail || null,
    });
    setIsComposeOpen(true);
  }, []);

  const closeComposeModal = useCallback(() => {
    console.log('Closing compose modal');
    setIsComposeOpen(false);
    // Сбрасываем данные формы после закрытия
    setComposeData({ to: '', subject: '', content: '' }); 
  }, []);

  // Значение, которое будет передано через контекст
  const value = {
    isComposeOpen,
    composeData,
    openComposeModal,
    closeComposeModal,
    setComposeData // Может понадобиться для обновления, например, тела письма
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};

// Хук для удобного использования контекста
export const useEmail = () => {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmail must be used within an EmailProvider');
  }
  return context;
}; 