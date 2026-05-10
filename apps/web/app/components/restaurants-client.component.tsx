'use client';

import React from 'react';
import {useRestaurantsQuery} from "@/app/features/restaurants/useRestaurantsQuery.hook";

export interface RestaurantsClientProps {
    clientOnly?: boolean;
}

const RestaurantsClient = ({ clientOnly = false }: RestaurantsClientProps) => {
    const isMounted = typeof window !== 'undefined';

    const enabled = !clientOnly || isMounted;
    const { data, isLoading, isError, error, isFetching } = useRestaurantsQuery({ enabled });

    if (clientOnly && !isMounted) return <div>Loading...</div>;
    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error: {(error as Error).message}</div>;

    return (
        <div style={{padding: 16}}>
            <h1>Restaurants {isMounted && isFetching ? '(updating...)' : ''}</h1>

            <ul>
                {data?.map((r) => (
                    <li key={r.id}>
                        <b>{r.name}</b> - {r.cuisine} - {r.city} - {r.rating} - {r.priceLevel} - {r.isOpen ? 'Open' : 'Closed'}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RestaurantsClient;