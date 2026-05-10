import {RestaurantModel} from "@/app/model/restaurant.model";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export async function fetchRestaurants(signal?: AbortSignal): Promise<RestaurantModel[]> {
    const res = await fetch(`${API_BASE_URL}/restaurants`, {
        method: 'GET',
        signal,
        headers: {'Accept': 'application/json'}
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch restaurants: ${res.status} ${res.statusText}`)
    }

    return res.json() as Promise<RestaurantModel[]>;
}