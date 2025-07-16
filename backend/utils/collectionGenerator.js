import crypto from 'crypto';

/**
 * Generate a random ID for development purposes
 */
const generateRandomId = () => crypto.randomBytes(12).toString('hex');

/**
 * Helper function to create product data
 * @param {Object} options - Product options
 * @returns {Object} Product object
 */
export const createProduct = ({
  name,
  description,
  brand = 'Generic',
  category = 'General',
  price = 99.99,
  countInStock = 10,
  image = '/images/sample.jpg',
  youtubeVideo = '',
}) => {
  return {
    _id: generateRandomId(),
    name,
    description,
    brand,
    category,
    price,
    countInStock,
    image,
    rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5
    numReviews: Math.floor(Math.random() * 50), // Random number of reviews
    youtubeVideo,
  };
};

/**
 * Helper function to create a subcollection
 * @param {Object} options - Subcollection options
 * @returns {Object} Subcollection object
 */
export const createSubcollection = ({
  name,
  description,
  image = '/images/sample.jpg',
  products = [],
}) => {
  return {
    _id: generateRandomId(),
    name,
    description,
    image,
    products,
  };
};

/**
 * Helper function to create a collection with products and subcollections
 * @param {Object} options - Collection options
 * @returns {Object} Collection object
 */
export const createCollection = ({
  name,
  description,
  image = '/images/sample.jpg',
  isPublic = true,
  requiresCode = false,
  products = [],
  subCollections = [],
}) => {
  return {
    _id: generateRandomId(),
    name,
    description,
    image,
    isPublic,
    requiresCode,
    products,
    subCollections,
  };
};

/**
 * Creates a complete data set with related collections and products
 * @param {number} numCollections - Number of collections to create
 * @param {number} numProducts - Products per collection
 * @returns {Object} Collections and products objects
 */
export const generateCollectionsWithProducts = (numCollections = 5, numProducts = 3) => {
  const collections = [];
  const allProducts = [];
  
  const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'];
  const brands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Amazon', 'Google'];
  
  for (let i = 0; i < numCollections; i++) {
    // Create products for this collection
    const collectionProducts = [];
    
    for (let j = 0; j < numProducts; j++) {
      const product = createProduct({
        name: `Product ${i+1}-${j+1}`,
        description: `This is a detailed description for product ${i+1}-${j+1}. It includes all the features and specifications that customers need to know about.`,
        brand: brands[Math.floor(Math.random() * brands.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        price: (Math.random() * 500 + 10).toFixed(2),
        countInStock: Math.floor(Math.random() * 100),
      });
      
      collectionProducts.push(product._id);
      allProducts.push(product);
    }
    
    // Create subcollections
    const subcollections = [];
    
    for (let k = 0; k < 2; k++) {
      // Create products for this subcollection
      const subCollectionProducts = [];
      
      for (let m = 0; m < Math.floor(numProducts/2); m++) {
        const product = createProduct({
          name: `Sub-Product ${i+1}-${k+1}-${m+1}`,
          description: `This is a detailed description for sub-product ${i+1}-${k+1}-${m+1}. It includes all the features and specifications that customers need to know about.`,
          brand: brands[Math.floor(Math.random() * brands.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          price: (Math.random() * 500 + 10).toFixed(2),
          countInStock: Math.floor(Math.random() * 100),
        });
        
        subCollectionProducts.push(product._id);
        allProducts.push(product);
      }
      
      const subcollection = createSubcollection({
        name: `Subcollection ${i+1}-${k+1}`,
        description: `This is a subcollection ${i+1}-${k+1} with its own products and features.`,
        products: subCollectionProducts,
      });
      
      subcollections.push(subcollection);
    }
    
    // Create the collection
    const collection = createCollection({
      name: `Collection ${i+1}`,
      description: `This is the main description for collection ${i+1}. It provides an overview of what customers can expect to find in this collection.`,
      products: collectionProducts,
      subCollections: subcollections,
      isPublic: true,
      requiresCode: i % 3 === 0, // Make every third collection require a code
    });
    
    collections.push(collection);
  }
  
  return { collections, products: allProducts };
};

export default {
  createProduct,
  createSubcollection,
  createCollection,
  generateCollectionsWithProducts,
};