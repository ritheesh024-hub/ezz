
import { FoodItem } from './store';
import placeholderData from './placeholder-images.json';

const getImg = (id: string) => placeholderData.placeholderImages.find(img => img.id === id)?.imageUrl || '';

export const MENU_ITEMS: FoodItem[] = [
  // Biryani
  { id: 'b-1', name: 'Hyderabadi Chicken Biryani', description: 'Long grain basmati rice cooked with tender chicken and authentic spices.', price: 249, category: 'Biryani', imageUrl: getImg('food-biryani-1'), isVeg: false, rating: 4.9, isAvailable: true, isFeatured: true },
  
  // Burgers
  { id: 'br-1', name: 'Classic Cheese Burger', description: 'Juicy chicken patty with melted cheese, lettuce, and secret sauce.', price: 129, category: 'Burgers', imageUrl: getImg('food-burger-1'), isVeg: false, rating: 4.6, isAvailable: true },
  
  // Pizza
  { id: 'pz-1', name: 'Farmhouse Margherita', description: 'Classic mozzarella cheese with fresh basil and tomato sauce.', price: 199, category: 'Pizza', imageUrl: getImg('food-pizza-1'), isVeg: true, rating: 4.4, isAvailable: true },
  
  // Momos
  { id: 'mm-1', name: 'Steamed Veg Momos', description: 'Hand-crafted dumplings filled with seasoned vegetables.', price: 99, category: 'Momos', imageUrl: getImg('food-momos-1'), isVeg: true, rating: 4.7, isAvailable: true },
  
  // Noodles
  { id: 'nd-1', name: 'Veg Hakka Noodles', description: 'Wok-tossed noodles with colorful veggies and soy sauce.', price: 149, category: 'Noodles', imageUrl: getImg('food-noodles-1'), isVeg: true, rating: 4.5, isAvailable: true },
  
  // Fried Rice
  { id: 'fr-1', name: 'Classic Fried Rice', description: 'Fluffy rice tossed with garden fresh vegetables and spices.', price: 139, category: 'Fried Rice', imageUrl: getImg('food-rice-1'), isVeg: true, rating: 4.3, isAvailable: true },
  
  // Snacks (Maggie)
  { id: 's-1', name: 'Classic Veg Maggie', description: 'Freshly prepared spicy masala maggie with garden fresh veggies.', price: 69, category: 'Snacks', imageUrl: getImg('food-maggie-1'), isVeg: true, rating: 4.5, isAvailable: true },
  { id: 's-2', name: 'Egg Maggie Special', description: 'Maggie infused with scrambled eggs and special cafe spices.', price: 89, category: 'Snacks', imageUrl: getImg('food-maggie-2'), isVeg: false, rating: 4.2, isAvailable: true },
  
  // Desserts
  { id: 'd-1', name: 'Death by Chocolate', description: 'Warm chocolate brownie served with vanilla scoop and hot fudge.', price: 159, category: 'Desserts', imageUrl: getImg('food-dessert-1'), isVeg: true, rating: 4.8, isAvailable: true },

  // Drinks (Tea & Coffee)
  { id: 'tea-1', name: 'Masala Tea', description: 'Authentic Indian tea brewed with ginger, cardamom, and secret spices.', price: 25, category: 'Drinks', imageUrl: getImg('tea-masala'), isVeg: true, rating: 4.8, isAvailable: true, isBeverage: true, isBestSeller: true },
  { id: 'coffee-2', name: 'Filter Coffee', description: 'Traditional South Indian decoction coffee with frothy milk.', price: 45, category: 'Drinks', imageUrl: getImg('coffee-filter'), isVeg: true, rating: 4.9, isAvailable: true, isBeverage: true, isBestSeller: true },
  { id: 'coffee-3', name: 'Cold Coffee', description: 'Creamy blended coffee served chilled with chocolate syrup.', price: 99, category: 'Drinks', imageUrl: getImg('coffee-cold'), isVeg: true, rating: 4.8, isAvailable: true, isBeverage: true, isPopular: true }
];

export const CATEGORIES = [
  'All', 
  'Biryani', 
  'Momos', 
  'Noodles', 
  'Fried Rice', 
  'Pizza', 
  'Burgers', 
  'Drinks', 
  'Desserts', 
  'Snacks'
];
