import { FC } from 'react';
import {OrderModel} from "@repo/contracts/order.model";

type CartProps = {
    order: OrderModel;
};

const Cart: FC<CartProps> = ({ order }) => {
    return (
        <div style={{ padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2>Order</h2>

            <div><b>ID:</b> {order.id}</div>
            <div><b>Version:</b> {order.version}</div>
            <div><b>State:</b> {order.state}</div>
            <div><b>Created:</b> {new Date(order.createdAt).toLocaleString()}</div>
            <div><b>Updated:</b> {new Date(order.updatedAt).toLocaleString()}</div>

            <h3 style={{ marginTop: 16 }}>Data</h3>
            <pre
                style={{
                    background: '#f5f5f5',
                    color: '#000',
                    padding: 12,
                    borderRadius: 6,
                    overflowX: 'auto'
                }}
            >
                {JSON.stringify(order.data, null, 2)}
            </pre>
        </div>
    );
};

export default Cart;
