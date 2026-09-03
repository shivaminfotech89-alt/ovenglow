import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Kashmiri Kesar & Roasted Pistachio White Chocolate',
    hindiSubname: 'कश्मीरी केसर एवं पिस्ता चॉकलेट',
    tagline: 'Infused with Grade-1 Pampore Saffron & Iranian Pistachios',
    description: 'A regal Indian creation marrying velvety 34% Swiss white cocoa butter with hand-plucked Kashmiri saffron threads and slow-roasted salted pistachios from the valleys. Hand-poured and dusted with 24K edible gold.',
    price: 549,
    originalPrice: 699,
    category: 'artisanal-chocolates',
    image: 'https://images.unsplash.com/photo-1548741487-18d16a1a0821?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 38,
    isVeg: true,
    rating: 4.9,
    reviewCount: 142,
    weightGrams: 100,
    cacaoPercentage: 34,
    shelfLife: '6 Months (Store at 16°C - 20°C)',
    isBestseller: true,
    isFestiveSpecial: true,
    flavorNotes: ['Floral Saffron', 'Nutty Pistachio', 'Honey Milk', 'Cardamom Whisper'],
    layers: [
      { name: 'Topping', description: '24K Edible Gold Leaf & Slivered Pistachios', color: '#E5A93C' },
      { name: 'Core Layer', description: '34% Swiss White Cocoa Ganache steeped with Kashmiri Kesar', color: '#FEF08A' },
      { name: 'Base Layer', description: 'Caramelized Roasted Salted Pistachio Praline Crunch', color: '#84CC16' }
    ]
  },
  {
    id: 'prod-2',
    name: 'Royal Mysore 72% Dark Single Origin Cocoa Bar',
    hindiSubname: 'मैसूर डार्क चॉकलेट बार',
    tagline: 'Deep Malabar coast single-estate cocoa beans with sea salt crystals',
    description: 'Crafted from hand-fermented cocoa beans sourced from shade-grown estates in South India. Features deep earthy fruit notes, zero refined sugar, and natural Madagascar bourbon vanilla.',
    price: 449,
    originalPrice: 550,
    category: 'artisanal-chocolates',
    image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 45,
    isVeg: true,
    rating: 4.8,
    reviewCount: 98,
    weightGrams: 90,
    cacaoPercentage: 72,
    shelfLife: '9 Months',
    isBestseller: true,
    flavorNotes: ['Dark Berry', 'Roasted Cocoa', 'Arabica Coffee', 'Smoked Sea Salt'],
    layers: [
      { name: 'Finish', description: 'Pink Himalayan Rock Salt & Cocoa Nibs Flakes', color: '#F472B6' },
      { name: 'Main Body', description: '72% Tempered Malabar Single-Origin Dark Silk', color: '#3A1D28' },
      { name: 'Base Snap', description: 'Stone-Ground Roasted Cacao Crisp Snap', color: '#1F0B14' }
    ]
  },
  {
    id: 'prod-3',
    name: 'Ovenglow Belgian Molten Chocolate Lava Cake',
    hindiSubname: 'बेल्जियन चॉकलेट लावा केक (अंडा-रहित)',
    tagline: 'Warm oozing Belgian dark ganache center in an airy sponge cake',
    description: 'Our signature 100% Eggless bakery sensation. Baked fresh every morning with 65% Callebaut dark chocolate. When warmed for 15 seconds, a rich, glossy river of warm chocolate cascades from its core.',
    price: 349,
    originalPrice: 420,
    category: 'gourmet-cakes',
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 14,
    isVeg: true,
    rating: 5.0,
    reviewCount: 310,
    weightGrams: 180,
    cacaoPercentage: 65,
    shelfLife: '4 Days (Refrigerate & Warm Before Serving)',
    isBestseller: true,
    flavorNotes: ['Warm Molten Ganache', 'Buttery Cocoa Crust', 'Dark Vanilla'],
    layers: [
      { name: 'Crown', description: 'Dusting of Dutch Cocoa & Silver Shimmer', color: '#D1D5DB' },
      { name: 'Outer Crust', description: 'Moist Dark Chocolate Sponge Baked to Velvet Perfection', color: '#451A03' },
      { name: 'Lava Core', description: 'Flowing 65% Warm Callebaut Belgian Truffle River', color: '#78350F' }
    ]
  },
  {
    id: 'prod-4',
    name: 'Golden Hazelnut Praline Truffle Jewels (Box of 12)',
    hindiSubname: 'गोल्डन हेज़लनट प्रालिन ट्रफ़ल्स',
    tagline: 'Crispy wafer sphere with roasted Piedmont hazelnut & gilded chocolate',
    description: 'An ode to luxury gifting. Each handcrafted jewel features a whole roasted hazelnut bathed in Gianduja cream, encased in a crisp wafer shell and dipped in gold-speckled milk chocolate crunch.',
    price: 899,
    originalPrice: 1150,
    category: 'truffles-bonbons',
    image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1526081347589-7fa3cb41b4b2?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 22,
    isVeg: true,
    rating: 4.9,
    reviewCount: 215,
    weightGrams: 240,
    cacaoPercentage: 45,
    shelfLife: '4 Months',
    isBestseller: true,
    isFestiveSpecial: true,
    flavorNotes: ['Roasted Hazelnut', 'Silky Gianduja', 'Caramel Milk', 'Crispy Wafer'],
    layers: [
      { name: 'Enrobing', description: 'Milk Chocolate & Crushed Roasted Hazelnut Shell', color: '#B45309' },
      { name: 'Crisp Barrier', description: 'Ultra-thin baked Parisian wafer dome', color: '#FDE68A' },
      { name: 'Center', description: 'Whole Italian Hazelnut & Whipped Cocoa Mousse', color: '#78350F' }
    ]
  },
  {
    id: 'prod-5',
    name: 'Ovenglow Signature Triple Chocolate Fudgy Brownie Cake',
    hindiSubname: 'ट्रिपल चॉकलेट ब्राउनी केक',
    tagline: 'Dense, glossy-crusted fudge brownie layered with dark chocolate ganache',
    description: 'Award-winning bakery masterpiece. Made with three grades of chocolate (Dark, Milk, and White chunks) blended with rich creamery butter. Cut into generous sharing slabs.',
    price: 699,
    originalPrice: 850,
    category: 'gourmet-cakes',
    image: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 19,
    isVeg: true,
    rating: 4.9,
    reviewCount: 184,
    weightGrams: 450,
    cacaoPercentage: 60,
    shelfLife: '7 Days in Chill',
    isBestseller: false,
    flavorNotes: ['Chewy Fudge', 'Caramelized Molasses', 'Triple Chocolate Chunks'],
    layers: [
      { name: 'Top Gloss', description: 'Mirror Glaze Dark Chocolate Drizzle with Walnut Halves', color: '#292524' },
      { name: 'Middle Layer', description: 'Heavy Fudge Brownie loaded with melted Belgian chunks', color: '#571F14' },
      { name: 'Base', description: 'Crispy caramelized cocoa bottom crust', color: '#1C1917' }
    ]
  },
  {
    id: 'prod-6',
    name: 'Cardamom & Rose Petal Praline Box (16 Pcs)',
    hindiSubname: 'इलायची और गुलाब प्रालिन बॉक्स',
    tagline: 'Infused with organic damask rose water & freshly crushed green elaichi',
    description: 'Inspired by royal Indian confectionery traditions. Smooth milk chocolate domes infused with fragrant Choti Elaichi, crowned with dried sun-kissed Kannauj rose petals.',
    price: 799,
    originalPrice: 999,
    category: 'truffles-bonbons',
    image: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 29,
    isVeg: true,
    rating: 4.7,
    reviewCount: 76,
    weightGrams: 200,
    cacaoPercentage: 40,
    shelfLife: '3 Months',
    isFestiveSpecial: true,
    flavorNotes: ['Cardamom Warmth', 'Sweet Damask Rose', 'Creamy Milk Truffle'],
    layers: [
      { name: 'Adornment', description: 'Kannauj Dried Rose Petals & Pistachio Slivers', color: '#FB7185' },
      { name: 'Shell', description: '40% Creamy Caramelized Milk Chocolate Shell', color: '#D97706' },
      { name: 'Filling', description: 'Crushed Cardamom & White Chocolate Infusion', color: '#FEF3C7' }
    ]
  },
  {
    id: 'prod-7',
    name: 'Artisanal Pain Au Chocolat & Almond Flaky Croissants (Box of 4)',
    hindiSubname: 'फ़्रेंच चॉकलेट और बादाम क्रोइसैन',
    tagline: '72-hour slow fermented laminated butter pastry stuffed with dark batons',
    description: 'Straight from our European deck ovens. Flaky, shatteringly crisp golden pastry layered with French churned butter and double batons of 55% dark chocolate, toasted with California sliced almonds.',
    price: 499,
    originalPrice: 620,
    category: 'bakery-pastries',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 8,
    isVeg: true,
    rating: 4.8,
    reviewCount: 89,
    weightGrams: 320,
    cacaoPercentage: 55,
    shelfLife: '3 Days (Best warm)',
    isBestseller: false,
    flavorNotes: ['Cultured Butter', 'Caramelized Flakes', 'Semi-sweet Dark Batons'],
    layers: [
      { name: 'Crust', description: 'Golden caramelized laminated 64-layer butter flakes', color: '#F59E0B' },
      { name: 'Pastry Web', description: 'Airy honeycombed sourdough croissant interior', color: '#FEF3C7' },
      { name: 'Core Filling', description: 'Dual molten dark chocolate artisan baking batons', color: '#451A03' }
    ]
  },
  {
    id: 'prod-8',
    name: 'The Grand Imperial Festive Ovenglow Hamper',
    hindiSubname: 'द ग्रैंड इंपीरियल फेस्टिव हैम्प़र',
    tagline: 'Luxury velvet box with Truffles, Saffron Chocolate, Brownie & Brass Diya',
    description: 'The ultimate celebratory gifting experience. Includes 12 assorted jewel truffles, 2 single-origin bars, 1 rich fudgy brownie box, artisanal chocolate coated almonds, and an artisanal engraved brass celebration diya with fragrant beeswax candle.',
    price: 2499,
    originalPrice: 3200,
    category: 'festive-hampers',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80',
    secondaryImages: [
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    stockCount: 16,
    isVeg: true,
    rating: 5.0,
    reviewCount: 164,
    weightGrams: 950,
    cacaoPercentage: 70,
    shelfLife: '4 Months',
    isBestseller: true,
    isFestiveSpecial: true,
    flavorNotes: ['Full Festive Spectrum', 'Velvety Ganache', 'Warm Spices', 'Toasted Nuts'],
    layers: [
      { name: 'Keepsake Box', description: 'Embossed Burgundy & Silver Foil Velvet Chest', color: '#4C0519' },
      { name: 'Confectionery', description: 'Truffle Collection & Saffron Bars in Satin Sleeves', color: '#E5A93C' },
      { name: 'Bakery Treats', description: 'Fresh Vacuum-Sealed Brownie Slices & Roasted Dragees', color: '#78350F' }
    ]
  }
];
