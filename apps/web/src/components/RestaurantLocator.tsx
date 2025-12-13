import { useState } from 'react';
import { MapPin, Navigation, Phone, Clock, Search } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone: string;
  hours: string;
  services: string[];
  coordinates: { lat: number; lng: number };
}

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Downtown Branch',
    address: '123 Main Street, New York, NY 10001',
    distance: '1.2 mi',
    phone: '(212) 555-0123',
    hours: 'Open 24 hours',
    services: ['Drive-thru', 'Delivery', 'Dine-in', 'Crypto Payment'],
    coordinates: { lat: 40.7589, lng: -73.9851 },
  },
  {
    id: '2',
    name: 'Westside Location',
    address: '456 West Avenue, New York, NY 10036',
    distance: '2.5 mi',
    phone: '(212) 555-0456',
    hours: '6:00 AM - 12:00 AM',
    services: ['Drive-thru', 'Delivery', 'Crypto Payment'],
    coordinates: { lat: 40.7614, lng: -73.9776 },
  },
  {
    id: '3',
    name: 'Airport Plaza',
    address: '789 Airport Road, Queens, NY 11371',
    distance: '4.1 mi',
    phone: '(718) 555-0789',
    hours: 'Open 24 hours',
    services: ['Delivery', 'Dine-in', 'Crypto Payment'],
    coordinates: { lat: 40.7769, lng: -73.874 },
  },
  {
    id: '4',
    name: 'Brooklyn Heights',
    address: '321 Brooklyn Ave, Brooklyn, NY 11201',
    distance: '3.8 mi',
    phone: '(718) 555-0321',
    hours: '7:00 AM - 11:00 PM',
    services: ['Drive-thru', 'Dine-in', 'Crypto Payment'],
    coordinates: { lat: 40.6974, lng: -73.9875 },
  },
];

export function RestaurantLocator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGetDirections = (restaurant: Restaurant) => {
    // Open Google Maps with directions
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${restaurant.coordinates.lat},${restaurant.coordinates.lng}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-2 text-gray-900">Find a Restaurant</h1>
          <p className="text-gray-600">Locate nearby restaurants and order ahead</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Search and List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Restaurant List */}
            <div className="space-y-3">
              {filteredRestaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => setSelectedRestaurant(restaurant.id)}
                  className={`w-full bg-white rounded-2xl shadow-sm p-4 text-left transition-all hover:shadow-md ${
                    selectedRestaurant === restaurant.id ? 'ring-2 ring-red-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-gray-900">{restaurant.name}</h3>
                    <span className="text-sm text-red-600">{restaurant.distance}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{restaurant.address}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{restaurant.hours}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right - Map and Details */}
          <div className="lg:col-span-2">
            {/* Mock Map */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-96 flex items-center justify-center relative">
                <div className="text-gray-500 text-center">
                  <MapPin className="w-16 h-16 mx-auto mb-2" />
                  <p>Interactive Map</p>
                </div>
                {/* Mock pins */}
                <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Selected Restaurant Details */}
            {selectedRestaurant && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                {(() => {
                  const restaurant = restaurants.find((r) => r.id === selectedRestaurant);
                  if (!restaurant) return null;

                  return (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="mb-2 text-gray-900">{restaurant.name}</h2>
                          <p className="text-gray-600">{restaurant.address}</p>
                        </div>
                        <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full">
                          {restaurant.distance}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <Phone className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="text-sm text-gray-600">Phone</div>
                            <div className="text-gray-900">{restaurant.phone}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <Clock className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="text-sm text-gray-600">Hours</div>
                            <div className="text-gray-900">{restaurant.hours}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="mb-3 text-gray-900">Services</h3>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.services.map((service) => (
                            <span
                              key={service}
                              className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleGetDirections(restaurant)}
                          className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                          <Navigation className="w-5 h-5" />
                          Get Directions
                        </button>
                        <button className="bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl transition-colors">
                          Order from Here
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
