// components/orders/OrderGrid.jsx
import { useState } from 'react';
import OrderCard from './OrderCard';
import Filters from './Filters';

const OrderGrid = ({ orders }) => {
  const [filteredOrders, setFilteredOrders] = useState(orders);

  return (
    <div className="order-panel">
      <Filters onFilterChange={(filters) => handleFilters(filters)} />
      
      <div className="order-grid">
        {filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            id={order.id}
            client={order.client.name}
            status={order.status}
            deadline={order.deadline}
            cargo={order.cargo.name}
          />
        ))}
      </div>
    </div>
  );
};