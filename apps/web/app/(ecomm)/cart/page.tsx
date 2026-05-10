'use client';

import React from 'react';
import {OrderModel} from "@repo/contracts/order.model";
import Cart from "@/app/(ecomm)/cart/components/cart.component";

const stubOrder: OrderModel = {
    id: 'ord_stub_123',
    version: 1,
    state: 'DRAFT',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {
        stub: true,
        items: [
            {sku: 'SIM-123', qty: 1}
        ],
        pricing: {
            total: 100,
            currency: 'AED'
        }
    }
};

const CartPage = () => {
    return (
        <div style={{padding: 24}}>
            <Cart order={stubOrder}/>
        </div>
    );
};

export default CartPage;
