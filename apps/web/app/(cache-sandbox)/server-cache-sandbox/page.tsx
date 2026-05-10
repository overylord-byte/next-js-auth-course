import React from 'react';
import {createServerQueryClient} from "@/app/(cache-sandbox)/server-cache-sandbox/providers/react-query.server";
import {restaurantsKeys} from "@/app/features/restaurants/restaurants.keys";
import {fetchRestaurants} from "@/app/features/restaurants/restaurants.api";
import {HydrationBoundary, dehydrate} from "@tanstack/react-query";
import RestaurantsClient from "@/app/components/restaurants-client.component";

const ServerCacheSandboxPage = async () => {
    const queryClient = createServerQueryClient();

    await queryClient.prefetchQuery({
        queryKey: restaurantsKeys.all,
        queryFn: () => fetchRestaurants()
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <RestaurantsClient/>
        </HydrationBoundary>
    );
};

export default ServerCacheSandboxPage;