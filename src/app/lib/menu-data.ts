
import { FoodItem } from './store';

export const MENU_ITEMS: FoodItem[] = [
  {
    id: '1',
    name: 'Classic Veg Maggie',
    description: 'Freshly prepared spicy masala maggie with chopped veggies.',
    price: 69,
    category: 'Maggie',
    image: 'https://picsum.photos/seed/maggie1/600/400',
    isVeg: true,
    rating: 4.5,
    isAvailable: true
  },
  {
    id: '2',
    name: 'Egg Maggie Special',
    description: 'Maggie infused with scrambled eggs and special cafe spices.',
    price: 89,
    category: 'Maggie',
    image: 'https://picsum.photos/seed/maggie2/600/400',
    isVeg: false,
    rating: 4.2,
    isAvailable: true
  },
  {
    id: '3',
    name: 'Hyderabadi Chicken Biryani',
    description: 'Long grain basmati rice cooked with tender chicken and authentic spices.',
    price: 249,
    category: 'Biryani',
    image: 'https://picsum.photos/seed/biryani1/600/400',
    isVeg: false,
    rating: 4.9,
    isAvailable: true
  },
  {
    id: '4',
    name: 'Paneer Steam Momos',
    description: 'Delicate dumplings filled with spiced paneer and herbs (8 pcs).',
    price: 129,
    category: 'Momos',
    image: 'https://picsum.photos/seed/momos1/600/400',
    isVeg: true,
    rating: 4.6,
    isAvailable: true
  },
  {
    id: '5',
    name: 'Classic Chocolate Sundae',
    description: 'Vanilla ice cream topped with rich chocolate syrup and nuts.',
    price: 149,
    category: 'Ice Creams',
    image: 'https://picsum.photos/seed/icecream1/600/400',
    isVeg: true,
    rating: 4.8,
    isAvailable: true
  },
  {
    id: '6',
    name: 'Spicy Chicken Maggie',
    description: 'Stir fried maggie with chunks of spicy roasted chicken.',
    price: 109,
    category: 'Maggie',
    image: 'https://picsum.photos/seed/maggie3/600/400',
    isVeg: false,
    rating: 4.4,
    isAvailable: true
  }
];

export const CATEGORIES = ['All', 'Maggie', 'Biryani', 'Momos', 'Ice Creams'];
