export type OrderState = 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED' | 'EXPIRED';

export interface OrderModel {
    id: string;
    version: number;
    state: OrderState;
    data: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

export type OrderEventType = 'ORDER_SNAPSHOT' | 'PING' | 'ERROR';

export interface OrderEventBase {
    eventId: number;     // monotonic per-order
    type: OrderEventType;
    orderId: string;
    ts: number;
}

export interface OrderSnapshotEvent extends OrderEventBase {
    type: 'ORDER_SNAPSHOT';
    version: number;
    payload: {
        kind: 'stub' | 'current';
        order: OrderModel;
    };
}

export interface PingEvent extends OrderEventBase {
    type: 'PING';
    payload: { message: 'ping' };
}

export interface ErrorEvent extends OrderEventBase {
    type: 'ERROR';
    payload: { code: string; message: string };
}

export type OrderEvent = OrderSnapshotEvent | PingEvent | ErrorEvent;

export interface CreateOrderRequest {
    clientSessionId?: string;
    context?: Record<string, unknown>;
}

export interface CreateOrderResponse {
    orderId: string;
    order: OrderModel;
}
