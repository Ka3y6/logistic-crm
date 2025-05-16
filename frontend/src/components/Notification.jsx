// components/Notification.jsx
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Notification = () => {
  return <ToastContainer position="bottom-right" autoClose={3000} />;
};

// Пример использования в компоненте заказов:
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await api.patch(`/orders/${orderId}/`, { status: newStatus });
    toast.success(`Статус заказа #${orderId} изменен на "${newStatus}"`);
  } catch (err) {
    toast.error('Ошибка обновления статуса');
  }
};