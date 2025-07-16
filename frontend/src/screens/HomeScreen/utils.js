import { format } from 'date-fns';

// Format date for display
export const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
        return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
        return 'Invalid date';
    }
};

// Get all public collections and ensure they're sorted by displayOrder
export const getAllCollections = (collectionsData) => {
    if (!collectionsData || !collectionsData.publicCollections) {
        return [];
    }

    // Get public collections from the response and filter out null/undefined items
    const collections = collectionsData.publicCollections.filter(collection => collection != null);

    // Sort by displayOrder (if available)
    return collections.sort((a, b) => {
        // If displayOrder is undefined, treat as highest number
        const orderA = a.displayOrder !== undefined ? a.displayOrder : Number.MAX_SAFE_INTEGER;
        const orderB = b.displayOrder !== undefined ? b.displayOrder : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
    });
};