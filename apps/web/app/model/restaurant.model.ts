export interface RestaurantModel {
    id: number;
    name: string;
    cuisine: string;
    rating: number;
    priceLevel: '$$$$' | '$$$' | '$$' | '$';
    city: string;
    isOpen: boolean;
}