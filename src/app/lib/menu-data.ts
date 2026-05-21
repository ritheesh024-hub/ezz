
import { FoodItem } from './store';
import placeholderData from './placeholder-images.json';

const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

export const MENU_ITEMS: FoodItem[] = [
  {
    id: '1',
    name: 'Classic Veg Maggie',
    description: 'Freshly prepared spicy masala maggie with garden fresh veggies.',
    price: 69,
    category: 'Veg Maggie',
    imageUrl: getImg('food-maggie-1'),
    isVeg: true,
    rating: 4.5,
    isAvailable: true
  },
  {
    id: '2',
    name: 'Egg Maggie Special',
    description: 'Maggie infused with scrambled eggs and special cafe spices.',
    price: 89,
    category: 'Egg Maggie',
    imageUrl: getImg('food-maggie-2'),
    isVeg: false,
    rating: 4.2,
    isAvailable: true
  },
  {
    id: '3',
    name: 'Spicy Chicken Maggie',
    description: 'Stir fried maggie with chunks of spicy roasted chicken.',
    price: 109,
    category: 'Chicken Maggie',
    imageUrl: getImg('food-maggie-3'),
    isVeg: false,
    rating: 4.4,
    isAvailable: true
  },
  {
    id: '4',
    name: 'Hyderabadi Chicken Biryani',
    description: 'Long grain basmati rice cooked with tender chicken and authentic spices.',
    price: 249,
    category: 'Chicken Biryani',
    imageUrl: getImg('food-biryani-1'),
    isVeg: false,
    rating: 4.9,
    isAvailable: true
  },
  {
    id: '5',
    name: 'Paneer Steam Momos',
    description: 'Delicate dumplings filled with spiced paneer and herbs (8 pcs).',
    price: 129,
    category: 'Momos',
    imageUrl: getImg('food-momos-1'),
    isVeg: true,
    rating: 4.6,
    isAvailable: true
  },
  {
    id: '6',
    name: 'Classic Chocolate Sundae',
    description: 'Vanilla ice cream topped with rich chocolate syrup and nuts.',
    price: 149,
    category: 'Ice creams',
    imageUrl: getImg('food-icecream-1'),
    isVeg: true,
    rating: 4.8,
    isAvailable: true
  }
];

export const CATEGORIES = ['All', 'Veg Maggie', 'Egg Maggie', 'Chicken Maggie', 'Chicken Biryani', 'Momos', 'Ice creams'];
