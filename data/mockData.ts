
import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '101',
    name: 'Brembo GT Braking System Kit',
    category: 'Brakes',
    price: 1250.00,
    image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop',
    isNew: true,
    rating: 5.0,
    stock: 5,
    description: 'Complete braking system upgrade for high-performance track and street use. Includes calipers, rotors, pads, and lines.'
  },
  {
    id: '102',
    name: 'Garrett G-Series Turbocharger',
    category: 'Engine',
    price: 2499.99,
    image: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop',
    rating: 4.8,
    stock: 3,
    description: 'Next generation turbocharger technology offering higher flow and efficiency in a smaller package.'
  },
  {
    id: '103',
    name: 'KW V3 Coilover Suspension',
    category: 'Suspension',
    price: 1895.50,
    image: 'https://images.unsplash.com/photo-1614251412693-4a1f6494cb68?q=80&w=2940&auto=format&fit=crop',
    rating: 4.9,
    stock: 8,
    description: 'Fully adjustable coilover system for street and track. Independent compression and rebound damping adjustment.'
  },
  {
    id: '104',
    name: 'Akrapovič Titanium Exhaust',
    category: 'Exhaust',
    price: 3200.00,
    image: 'https://images.unsplash.com/photo-1565538361093-9c59573887c3?q=80&w=2940&auto=format&fit=crop',
    isNew: true,
    rating: 5.0,
    stock: 2,
    description: 'Ultra-lightweight titanium exhaust system improving power and torque while reducing weight.'
  },
  {
    id: '105',
    name: 'Recaro Sportster CS Seat',
    category: 'Interior',
    price: 1450.00,
    image: 'https://images.unsplash.com/photo-1582239433989-13833215904d?q=80&w=2848&auto=format&fit=crop',
    rating: 4.7,
    stock: 10,
    description: 'The perfect compromise between a racing shell and a comfortable sports seat. heated and airbag compatible versions available.'
  },
  {
    id: '106',
    name: 'BBS FI-R Forged Wheels',
    category: 'Wheels',
    price: 2150.00,
    image: 'https://images.unsplash.com/photo-1605658632617-640954992524?q=80&w=2940&auto=format&fit=crop',
    rating: 5.0,
    stock: 16,
    description: 'One of the lightest forged aluminum wheels available. Designed for maximum strength and minimum weight.'
  },
  {
    id: '107',
    name: 'MOMO Montecarlo Steering Wheel',
    category: 'Interior',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1595188800996-3c0f46c6422d?q=80&w=2940&auto=format&fit=crop',
    rating: 4.5,
    stock: 20,
    description: 'Classic leather steering wheel with black spokes and anatomic grip. Requires hub adapter.'
  },
  {
    id: '108',
    name: 'K&N High-Flow Air Filter',
    category: 'Engine',
    price: 65.99,
    image: 'https://images.unsplash.com/photo-1508209803874-51e443831844?q=80&w=2940&auto=format&fit=crop',
    rating: 4.6,
    stock: 50,
    description: 'Washable and reusable air filter designed to increase horsepower and acceleration.'
  },
  // Flash Sale Items
  {
    id: 'fs-1',
    name: 'Castrol Edge 5W-30 Full Synthetic Oil',
    category: 'Fluids',
    price: 24.99,
    originalPrice: 45.00,
    image: 'https://images.unsplash.com/photo-1563290747-0e3189196b42?q=80&w=2832&auto=format&fit=crop',
    rating: 4.9,
    stock: 100,
    isFlashSale: true
  },
  {
    id: 'fs-2',
    name: 'Sparco Racing Gloves',
    category: 'Interior',
    price: 89.00,
    originalPrice: 120.00,
    image: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop',
    rating: 4.7,
    stock: 15,
    isFlashSale: true
  },
  {
    id: 'fs-3',
    name: 'NGK Iridium Spark Plugs (Set of 4)',
    category: 'Engine',
    price: 35.50,
    originalPrice: 52.00,
    image: 'https://images.unsplash.com/photo-1628522336332-9cb52501a35c?q=80&w=2960&auto=format&fit=crop',
    rating: 4.8,
    stock: 40,
    isFlashSale: true
  },
  {
    id: 'fs-4',
    name: 'Michelin Pilot Sport 4S',
    category: 'Wheels',
    price: 285.00,
    originalPrice: 345.00,
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da645217?q=80&w=2940&auto=format&fit=crop',
    rating: 5.0,
    isNew: true,
    stock: 8,
    isFlashSale: true
  },
  {
    id: 'fs-5',
    name: 'K&N Air Filter Cleaning Kit',
    category: 'Maintenance',
    price: 15.99,
    originalPrice: 24.99,
    image: 'https://images.unsplash.com/photo-1632512396328-9d5113945415?q=80&w=2940&auto=format&fit=crop',
    rating: 4.5,
    stock: 25,
    isFlashSale: true
  }
];
