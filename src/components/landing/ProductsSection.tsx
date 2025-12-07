import { useState } from 'react';
import { Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Big Mac',
    description: 'Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun',
    price: 5.99,
    image: '🍔',
    category: 'Burgers',
  },
  {
    id: '2',
    name: 'Quarter Pounder',
    description: 'Quarter pound of 100% fresh beef, topped with tangy pickles, onions, ketchup and mustard',
    price: 6.49,
    image: '🍔',
    category: 'Burgers',
  },
  {
    id: '3',
    name: 'McChicken',
    description: 'Crispy chicken sandwich with lettuce and mayo',
    price: 4.99,
    image: '🍗',
    category: 'Chicken',
  },
  {
    id: '4',
    name: 'Filet-O-Fish',
    description: 'Wild-caught Alaskan Pollock, tartar sauce and American cheese',
    price: 5.49,
    image: '🐟',
    category: 'Fish',
  },
  {
    id: '5',
    name: 'McDouble',
    description: 'Two 100% beef patties, pickles, onions, ketchup and mustard',
    price: 3.99,
    image: '🍔',
    category: 'Burgers',
  },
  {
    id: '6',
    name: 'Chicken McNuggets',
    description: '10 pieces of tender, juicy chicken nuggets',
    price: 5.99,
    image: '🍗',
    category: 'Chicken',
  },
  {
    id: '7',
    name: 'French Fries',
    description: 'World famous fries, golden and crispy',
    price: 2.99,
    image: '🍟',
    category: 'Sides',
  },
  {
    id: '8',
    name: 'Coca-Cola',
    description: 'Refreshing Coca-Cola soft drink',
    price: 1.99,
    image: '🥤',
    category: 'Drinks',
  },
  {
    id: '9',
    name: 'McFlurry',
    description: 'Creamy soft serve with M&M\'s or Oreo',
    price: 3.49,
    image: '🍦',
    category: 'Desserts',
  },
];

const categories = ['All', 'Burgers', 'Chicken', 'Sides', 'Drinks', 'Desserts'];

interface ProductsSectionProps {
  onAddToCart: (id: string, name: string, price: number, image: string) => void;
  cart: { [key: string]: any };
}

export function ProductsSection({ onAddToCart, cart }: ProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <section id="products" className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Category Filter */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-gray-100 group"
            >
              {/* Product Image */}
              <div className="bg-gradient-to-br from-yellow-50 to-red-50 p-8 flex items-center justify-center">
                <div className="text-8xl group-hover:scale-110 transition-transform">
                  {product.image}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-gray-900">{product.name}</h3>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                    ${product.price}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>

                <button
                  onClick={() => onAddToCart(product.id, product.name, product.price, product.image)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add to Cart
                </button>

                {cart[product.id] && (
                  <div className="mt-2 text-center text-sm text-gray-600">
                    {cart[product.id].quantity} in cart
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}