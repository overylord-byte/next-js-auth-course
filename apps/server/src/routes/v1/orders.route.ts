import {Router, Request, Response} from "express";
import {CreateOrderRequest, CreateOrderResponse, OrderModel} from "@repo/contracts/order.model";
import {createOrder, getOrder} from "@/store/order.store";

export const ordersRouter = Router();

type OrderParams = {
    orderId: string;
}

// POST /api/v1/orders/create
ordersRouter.post(
    '/create',
    async (
        req: Request<unknown, CreateOrderResponse, CreateOrderRequest>,
        res: Response<CreateOrderResponse>
    ) => {
        const { clientSessionId, context } = req.body ?? {};

        const order = createOrder(context, clientSessionId);

        res.status(201).json({
            orderId: order.id,
            order
        });
    }
);

// GET /api/v1/orders/:orderId
ordersRouter.get(
    "/:orderId",
    async (
        req: Request<OrderParams>,
        res: Response<OrderModel | { message: string }>) => {
        const {orderId} = req.params;

        const order = getOrder(orderId);
        if (!order) {
            res.status(404).json({message: 'Order is not found'});
            return;
        }

        res.status(200).json(order);
    }
)
