import {RestaurantModel} from "@/app/model/restaurant.model";
import {useQuery} from "@tanstack/react-query";
import {restaurantsKeys} from "@/app/features/restaurants/restaurants.keys";
import {fetchRestaurants} from "@/app/features/restaurants/restaurants.api";

export interface UseRestaurantsQueryOptions {
    /** Когда false — запрос не выполняется (удобно для client-only: включить после mount). */
    enabled?: boolean;
}

export function useRestaurantsQuery(options?: UseRestaurantsQueryOptions) {
    const { enabled = true } = options ?? {};
    return useQuery<RestaurantModel[]>({
        queryKey: restaurantsKeys.all,
        queryFn: ({ signal }) => fetchRestaurants(signal),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
        enabled,
    });
}