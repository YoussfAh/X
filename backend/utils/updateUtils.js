import Collection from '../models/collectionModel.js';
import User from '../models/userModel.js';

/**
 * @description Asynchronously syncs updates from a core collection to all user assignment records.
 * This is designed to be called without 'await' so it runs in the background.
 * @param {string} collectionId - The ID of the core collection that was just updated.
 */
export const syncUpdatedCollectionToUsers = async (collectionId) => {
  console.log(`[Sync Task Started] for collectionId: ${collectionId}`);
  try {
    // 1. Fetch the latest, updated data from the core collection.
    const coreCollection = await Collection.findById(collectionId).lean();

    if (!coreCollection) {
      console.log(`[Sync Task] Collection ${collectionId} not found. Aborting.`);
      return;
    }

    // 2. Prepare the fields that need to be synced.
    // We use the '$' positional operator in the update to target the correct array element.
    const fieldsToSync = {
      'assignedCollections.$.name': coreCollection.name,
      'assignedCollections.$.description': coreCollection.description,
      'assignedCollections.$.image': coreCollection.image,
      'assignedCollections.$.isPublic': coreCollection.isPublic,
      // Add any other fields from the core collection that are stored in the assignment.
    };

    // 3. Execute the highly efficient updateMany command.
    // This finds all users who have this collection assigned and updates only the
    // relevant fields in their embedded assignment document.
    const result = await User.updateMany(
      { 'assignedCollections.collectionId': collectionId }, // Filter: Find users with this collection assigned.
      { $set: fieldsToSync } // Action: Set the new values on the matched array element.
    );

    console.log(
      `[Sync Task Complete] for collectionId: ${collectionId}. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount} user records.`
    );
  } catch (error) {
    console.error(
      `[Sync Task Failed] for collectionId: ${collectionId}. Error: ${error.message}`
    );
  }
}; 