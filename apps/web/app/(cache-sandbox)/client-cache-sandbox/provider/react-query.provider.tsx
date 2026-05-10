'use client';

import React, {FC, PropsWithChildren} from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: true,
                retry: 1
            }
        }
    });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}

const ReactQueryProvider: FC<PropsWithChildren> = ({children}) => {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default ReactQueryProvider;