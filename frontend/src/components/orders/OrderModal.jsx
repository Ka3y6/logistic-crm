// components/orders/OrderModal.jsx
const OrderModal = ({ order, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Заказ #{order.id}</h2>
        <p><strong>Клиент:</strong> {order.client.name}</p>
        <p><strong>Груз:</strong> {order.cargo.name} ({order.cargo.weight} кг)</p>
        <p><strong>Статус:</strong> <span className={`status-${order.status}`}>{order.status}</span></p>
        <button onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
};