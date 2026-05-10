import {OrderModel} from "@repo/contracts/order.model";
import {randomUUID} from "node:crypto";

const orders = new Map<string, OrderModel>();

export const createOrder = (
    context?: Record<string, unknown>,
    clientSessionId?: string
): OrderModel => {
    const now = Date.now();

    const order: OrderModel = {
        id: randomUUID(),
        version: 1,
        state: 'DRAFT',
        createdAt: now,
        updatedAt: now,
        data: {
            stub: true,
            context: context ?? {},
            clientSessionId: clientSessionId ?? null
        }
    };

    orders.set(order.id, order);

    return order;
};

export const getOrder = (id: string): OrderModel | undefined => {
    return orders.get(id);
}

