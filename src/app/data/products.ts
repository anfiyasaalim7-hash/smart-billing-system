export interface Product {
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  scanCount?: number; // For heatmap analytics
  lastScanned?: number; // For heatmap analytics
  image?: string; // For computer vision
}

export const products: Product[] = [
  {
    barcode: "8901234567890",
    name: "Organic Honey",
    price: 450,
    stock: 50,
    category: "Organic"
  },
  {
    barcode: "8901234567891",
    name: "Basmati Rice",
    price: 850,
    stock: 100,
    category: "Grains"
  },
  {
    barcode: "8901234567892",
    name: "Special Coffee",
    price: 650,
    stock: 75,
    category: "Beverages"
  },
  {
    barcode: "8901234567893",
    name: "Premium Tea",
    price: 350,
    stock: 60,
    category: "Beverages"
  },
  {
    barcode: "8901234567894",
    name: "Olive Oil",
    price: 950,
    stock: 40,
    category: "Oils"
  },
  {
    barcode: "8901234567895",
    name: "Whole Wheat Flour",
    price: 250,
    stock: 120,
    category: "Grains"
  },
  {
    barcode: "8901234567896",
    name: "Almond Pack",
    price: 1200,
    stock: 30,
    category: "Dry Fruits"
  },
  {
    barcode: "8901234567897",
    name: "Cashew Pack",
    price: 1500,
    stock: 25,
    category: "Dry Fruits"
  }
];

// Make products array mutable for add/remove functionality
let productsList: Product[] = [...products];

export const getProductByBarcode = (barcode: string): Product | undefined => {
  return productsList.find(p => p.barcode === barcode);
};

export const getAllProducts = (): Product[] => {
  return productsList;
};

export const addProduct = (product: Product): void => {
  productsList.push(product);
};

export const removeProduct = (barcode: string): void => {
  productsList = productsList.filter(p => p.barcode !== barcode);
};

export const updateProduct = (barcode: string, updates: Partial<Product>): void => {
  const index = productsList.findIndex(p => p.barcode === barcode);
  if (index >= 0) {
    productsList[index] = { ...productsList[index], ...updates };
  }
};

export const updateScanCount = (barcode: string): void => {
  const product = productsList.find(p => p.barcode === barcode);
  if (product) {
    product.scanCount = (product.scanCount || 0) + 1;
    product.lastScanned = Date.now();
  }
};