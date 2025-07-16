# Documentation: Core Collections vs. Assigned Collections

This document outlines the data model, storage mechanisms, and data flow for Core Collections and user-specific Assigned Collections within the application. Understanding this distinction is crucial for backend development, frontend implementation, and administrative management.

---

### 1. Core Collections (The "Normal" Collections)

Core Collections represent the master records for every collection that exists in the system. They are the single source of truth.

-   **Storage Location:** Stored as individual documents in the **`collections` collection** in MongoDB.
-   **Purpose:** To act as a master template for a collection's content, including its name, description, image, and associated products.
-   **Key Data Fields:**
    -   `_id`: The unique MongoDB identifier for the collection.
    -   `name`: The official title of the collection.
    -   `description`: A detailed description of the collection's content.
    -   `image`: The URL for the primary cover image.
    -   `products`: An array of `ObjectId`s referencing documents in the `products` collection.
    -   `isPublic`: A boolean (`true`/`false`) that determines if the collection is visible to all users or only to those it's assigned to.
    -   `requiresCode`: A boolean that determines if an access code is needed for entry.
-   **Managed By:** Administrators, via the "Collections" section in the admin panel.

---

### 2. Assigned Collections (A User's Personalized Copy)

An "Assigned Collection" is not a separate type of collection. It is a **personalized snapshot** of a Core Collection that has been specifically given to a single user.

-   **Storage Location:** Stored as an array of sub-documents inside a field named **`assignedCollections`** directly on a **user's document** in the **`users` collection**.
-   **Purpose:** To represent a specific user's entitlement to a collection and to store personalized data related to that assignment (like admin notes or status) without altering the Core Collection.
-   **Data Model (The "Copy + Reference" Hybrid):** This is the most critical concept. When a collection is assigned to a user, the system does **both**:
    1.  **It COPIES Data:** Key information like `name`, `description`, and `image` is copied from the Core Collection into the user's assignment record. This is a crucial performance optimization, allowing the frontend to display basic information on the home screen without needing to perform a second database lookup.
    2.  **It STORES a Reference:** The `_id` of the Core Collection is stored as `collectionId` inside the assignment record. This maintains a permanent link back to the original master template, which is used when the user clicks to view the full collection.
-   **Key Data Fields within the `assignedCollections` array:**
    -   `collectionId`: An `ObjectId` that **references** the `_id` of the original document in the `collections` collection.
    -   `name`, `description`, `image`: **Copied** data from the original collection at the time of assignment.
    -   `assignedBy`: The `ObjectId` of the admin who made the assignment.
    -   `assignedAt`: A `Date` timestamp of when the assignment was made.
    -   `notes`, `status`, `tags`: Personalized metadata that applies *only* to this specific user's version of the assignment.

---

### 3. Data Flow and Key Scenarios

#### How a Collection is Assigned (Admin or Quiz)
1.  An admin (or the quiz system) initiates an assignment.
2.  The backend API receives the request, containing the `userId` and the `collectionId` of the Core Collection.
3.  The API first looks up the Core Collection from the `collections` collection to get its details.
4.  It then creates a new "assignment object," **copying** the `name`, `image`, `description`, etc.
5.  This new object is then pushed (`.push()`) into the `assignedCollections` array on the specified user's document.
6.  The user document is saved to the database.

#### How the Home Screen Gets Assigned Collection Data
1.  When a user logs in, their full user document is fetched from the database. This document includes the complete `assignedCollections` array with all its copied data.
2.  This `userInfo` object is sent to the frontend and stored in the global Redux state.
3.  The `AssignedCollections` component on the home screen simply reads this array directly from the `userInfo` object in Redux.
4.  **Crucially, no extra API call is needed** just to display the assigned collections. This makes the home screen load very quickly.

#### What Happens When a Core Collection is Updated?
This is a key consequence of the "copy" architecture.
-   Because the data is **copied** upon assignment, if an admin later updates the name or image of a Core Collection, the changes **will not automatically appear** in the collections already assigned to users. Their versions are snapshots.
-   To solve this, your system has a specific backend function (`updateExistingAssignedCollections`) that an admin can trigger. This function iterates through a user's assignments, looks up the latest data from the Core Collections using the `collectionId` reference, and updates the copied data.

---
This documentation provides a complete overview of the collection assignment system. By understanding this "Copy + Reference" model, developers can maintain and extend the feature reliably. 