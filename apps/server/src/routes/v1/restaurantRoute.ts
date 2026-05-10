import {Router} from "express";

interface RestaurantModel {
    id: number;
    name: string;
    cuisine: string;
    rating: number;
    priceLevel: '$$$$' | '$$$' | '$$' | '$';
    city: string;
    isOpen: boolean;
}

const RESTAURANTS_MOCK: RestaurantModel[] =
    [
        {
            "id": 1,
            "name": "Golden Fork",
            "cuisine": "International",
            "rating": 4.6,
            "priceLevel": "$$$",
            "city": "Dubai",
            "isOpen": true
        },
        {
            "id": 2,
            "name": "La Piazza",
            "cuisine": "Italian",
            "rating": 4.4,
            "priceLevel": "$$",
            "city": "Dubai",
            "isOpen": true
        },
        {
            "id": 3,
            "name": "Spice Route",
            "cuisine": "Indian",
            "rating": 4.7,
            "priceLevel": "$$",
            "city": "Abu Dhabi",
            "isOpen": false
        },
        {
            "id": 4,
            "name": "Tokyo Bento",
            "cuisine": "Japanese",
            "rating": 4.3,
            "priceLevel": "$$",
            "city": "Dubai",
            "isOpen": true
        },
        {
            "id": 5,
            "name": "Le Petit Bistro",
            "cuisine": "French",
            "rating": 4.8,
            "priceLevel": "$$$$",
            "city": "Paris",
            "isOpen": true
        },
        {
            "id": 6,
            "name": "Burger Station",
            "cuisine": "American",
            "rating": 4.1,
            "priceLevel": "$",
            "city": "Berlin",
            "isOpen": true
        },
        {
            "id": 7,
            "name": "Green Bowl",
            "cuisine": "Vegan",
            "rating": 4.5,
            "priceLevel": "$$",
            "city": "Amsterdam",
            "isOpen": false
        },
        {
            "id": 8,
            "name": "Casa del Taco",
            "cuisine": "Mexican",
            "rating": 4.2,
            "priceLevel": "$",
            "city": "Madrid",
            "isOpen": true
        },
        {
            "id": 9,
            "name": "Nordic Table",
            "cuisine": "Scandinavian",
            "rating": 4.9,
            "priceLevel": "$$$$",
            "city": "Copenhagen",
            "isOpen": true
        },
        {
            "id": 10,
            "name": "Street Wok",
            "cuisine": "Asian Fusion",
            "rating": 4.0,
            "priceLevel": "$$",
            "city": "Singapore",
            "isOpen": true
        }
    ]



export const restaurantRouter = Router();

//GET /api/v1/restaurants
restaurantRouter.get("/", (_req, res) => {
    res.json(RESTAURANTS_MOCK);
});