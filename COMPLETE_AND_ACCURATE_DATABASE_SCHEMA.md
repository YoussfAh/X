# ERASER.IO DIAGRAM: COMPLETE & ACCURATE PRO-G DATABASE SCHEMA
#
# This document contains the complete, verified, and exhaustively detailed data structure of the application.
# It is designed to be a single source of truth for any developer, including beginners ("noops"), to understand the system.
# Paste this entire code block into eraser.io to visualize the complete architecture.
#
# ====================================================================================================
# SECTION 1: USER & AUTHENTICATION
# This section defines everything related to the user, from their login details to their personal info and security settings.
# The 'users' model is the central hub of the entire application.
# ====================================================================================================

//
users [icon: user, color: blue] {
  id ObjectId pk "The unique identifier for the user document in the database."
  
  # --- Core Account Information ---
  name String "The user's full name. This is required for all accounts."
  email String "The user's email address. This must be unique and is required. Used for login."
  password String "The user's hashed password. It's only required if the user is signing up with email/password, not with Google."
  googleId String "The unique ID provided by Google if the user signs in with their Google account. Sparse index allows for many null values."
  authProvider String "Indicates how the user authenticated. Can be 'local' (email/password) or 'google'. Defaults to 'local'."
  isAdmin Boolean "A true/false flag that determines if the user has access to administrative panels. Defaults to false."
  isSystem Boolean "A flag to identify a system-internal user, which might be used for automated tasks. Defaults to false."
  
  # --- User Status & Deactivation ---
  isDeactivated Boolean "A true/false flag for soft-deleting a user. Instead of deleting them, we can just deactivate them. Defaults to false."
  deactivationReason String "An optional note explaining why the user was deactivated, typically set by an admin."
  deactivatedAt Date "The date and time when the user was deactivated."

  # --- Personal & Contact Information ---
  whatsAppPhoneNumber String "The user's WhatsApp number, used for communication."
  country String "The user's country."
  dateOfBirth Date "The user's date of birth."
  gender String "The user's gender, can be 'male', 'female', or 'other'."
  instagramUsername String "The user's Instagram handle."
  facebookProfile String "A link to the user's Facebook profile."
  twitterUsername String "The user's Twitter handle."

  # --- Detailed Fitness & Health Profile ---
  height Number "The user's height, stored in centimeters."
  heightUnit String "The unit for height, can be 'cm' or 'in'. Defaults to 'cm'."
  weightUnit String "The unit for weight, can be 'kg' or 'lbs'. Defaults to 'kg'."
  fitnessLevel String "The user's self-assessed fitness level, can be 'beginner', 'intermediate', or 'advanced'."
  fitnessGoals [String] "A list of the user's fitness goals, e.g., ['Weight Loss', 'Muscle Gain']."
  age Number "The user's age."
  fitnessGoal String "A more specific fitness goal enum, can be 'gain weight', 'lose weight', etc."
  injuries String "A text field for the user to describe any current or past injuries."
  additionalInfo String "A general text field for any other relevant information the user wants to provide."

  # --- Application State & User Preferences ---
  quizCompleted Boolean "A flag to track if the user has completed the initial assessment quiz. Defaults to false."
  quizAnswers [object] "An array storing the user's answers to the quiz. Each object contains the question, the answer, and the question type."
  preferences object "An object to store user UI preferences, like if they have dismissed a notification banner (`quizBannerDismissed`)."
  carouselSlides [object] "A list of image slides specific to this user for their main hero carousel."

  # --- Security & Login Tracking ---
  lastLogin Date "The timestamp of the user's last successful login."
  loginHistory [object] "An array that logs each login event, storing the timestamp, IP address, and user agent."
  loginAttempts Number "The number of failed login attempts for the account. Defaults to 0."
  lockUntil Date "If the account is locked due to too many failed attempts, this timestamp shows when it will be unlocked."
  lastLoginIP String "The IP address from the user's last login."
  lastLoginAttempt Date "The timestamp of the last failed login attempt."
  registrationIP String "The IP address captured when the user registered."
  lastTokenIssuedAt Date "The timestamp when the last authentication token was generated for this user."
  sessionId String "A unique identifier for the user's current session."
  lastDeviceId String "An identifier for the last device that logged in."
  deviceLoginAttempts Map "A detailed map to track login attempts per device, enhancing security."

  # --- Admin-Managed Fields: Contact & Notes ---
  contactHistory [object] "A detailed log of all contacts made with the user by admins. Includes type, notes, status, duration, outcome, and follow-up dates."
  adminNotes [object] "A list of private notes about the user, added by admins. Each note has the text, the creator, and a timestamp."
  
  # --- Admin-Managed Fields: Time Frame Management ---
  timeFrame [object] "The currently active time period for a user (e.g., for a subscription). Includes start/end dates, duration, and status."
  timeFrameHistory [object] "A complete history of all past time frames assigned to the user."

  # --- Embedded Content Schemas (for quick access on user profiles) ---
  accessedCollections [object] "A list of content collections the user has ever accessed. Tracks collection ID, name, and access times."
  assignedCollections [object] "A list of collections specifically assigned to this user by an admin. This is a denormalized copy for performance, containing name, description, image, etc."
  lockedCollections [object] "A list of collections the user has purchased or gained access to that were previously locked."
}


# ====================================================================================================
# SECTION 2: CONTENT & E-COMMERCE
# This section defines the core content (Collections, Products) and the sales process (Orders).
# Collections are like courses, and Products are the individual items (workouts, diet plans) inside them.
# ====================================================================================================

collections [icon: folder-open, color: purple] {
  id ObjectId pk "The unique identifier for the collection."
  user ObjectId "A reference to the 'User' (admin) who created this collection."
  name String "The name of the collection. This is required."
  description String "A detailed description of the collection. This is required."
  image String "The URL for the collection's cover image. Has a default."
  products [object] "A list of products that belong to this collection. Each entry references a 'Product' and has a 'displayOrder' number."
  isPublic Boolean "A flag to determine if this collection is visible to everyone. Defaults to true."
  requiresCode Boolean "A flag to determine if an access code is needed to view this collection. Defaults to false."
  accessCode String "The specific code needed to access this collection if `requiresCode` is true."
  codeUpdatedAt Date "The timestamp when the access code was last changed."
  parentCollection ObjectId "A reference to another 'Collection', allowing for nested structures (e.g., a sub-collection)."
  displayOrder Number "A number used to sort collections on public pages. Defaults to 0."
  orderNumber String "An optional alternative identifier or SKU for the collection."
  isActive Boolean "An admin can use this flag to enable or disable the collection. Defaults to true."
}

products [icon: package, color: orange] {
  id ObjectId pk "The unique identifier for the product."
  user ObjectId "A reference to the 'User' (admin) who created this product."
  name String "The name of the product. This is required."
  image String "URL for the product's image. This is required."
  youtubeVideo String "A URL to a YouTube video for the product."
  category String "The category of the product (e.g., 'Workout', 'Diet Plan'). Required."
  description String "A detailed description of the product. Required."
  reviews [object] "A list of reviews submitted by users. Each review has a name, rating, comment, and user reference."
  rating Number "The average rating of the product, calculated from reviews. Defaults to 0."
  numReviews Number "The total number of reviews for the product. Defaults to 0."
  isMealDiet Boolean "A flag to identify if this product is a meal/diet plan. Defaults to false."
  isViewOnly Boolean "A flag to indicate if this product is for viewing only (e.g., an article). Defaults to false."
  
  # --- Fields for DIET products ---
  nutrition object "A detailed object containing nutritional information like calories, protein, carbs, fat, etc."
  mealType [String] "The type of meal, e.g., 'breakfast', 'lunch', 'dinner', 'snack'."
  dietaryRestrictions [String] "A list of dietary tags, e.g., 'vegetarian', 'vegan', 'gluten-free'."
  preparationTime Number "Time to prepare the meal, in minutes."
  ingredients [String] "A list of ingredients for the recipe."

  # --- Fields for WORKOUT products ---
  muscleGroups [String] "A list of all muscle groups targeted by the workout."
  primaryMuscleGroup String "The main muscle group targeted."
  exerciseType String "The type of exercise, e.g., 'strength', 'cardio'. Defaults to 'strength'."
  difficulty String "The difficulty level, e.g., 'beginner', 'intermediate', 'advanced'."
  equipmentNeeded [String] "A list of equipment required for the workout."
  instructions [object] "A step-by-step list of instructions for performing the exercise."
  safetyTips [String] "A list of safety tips."
  commonMistakes [String] "A list of common mistakes to avoid."
  alternatives [ObjectId] "A list of references to other 'Product' documents that are alternatives to this one."
  estimatedCaloriesPerMinute Number "Estimated calories burned per minute. Defaults to 5."
  averageDuration Number "Average duration of the workout in minutes. Defaults to 15."
  isCompound Boolean "Is this a compound exercise (multi-joint)? Defaults to false."
  isIsolation Boolean "Is this an isolation exercise (single-joint)? Defaults to false."
  restTimeRecommended object "Recommended rest time in seconds (min and max)."
  repRange object "Recommended rep range (min and max)."
  tags [String] "General purpose tags for searching and filtering."
  index Number "A number for ordering or indexing. Defaults to 0."
}

orders [icon: shopping-cart, color: green] {
  id ObjectId pk "The unique identifier for an order."
  user ObjectId "A reference to the 'User' who placed the order. Required."
  orderItems [object] "A list of items in the order. Each item has name, quantity, image, price, and a reference to the 'Product'."
  shippingAddress object "The customer's shipping address, including address, city, postal code, and country."
  paymentMethod String "The payment method used, e.g., 'PayPal', 'Stripe'. Required."
  paymentResult object "An object containing details from the payment provider after a successful transaction (id, status, etc.)."
  itemsPrice Number "The subtotal price of all items before tax and shipping. Required."
  taxPrice Number "The amount of tax for the order. Required."
  shippingPrice Number "The shipping cost for the order. Required."
  totalPrice Number "The final total price of the order. Required."
  isPaid Boolean "A flag indicating if the order has been paid for. Defaults to false."
  paidAt Date "The timestamp when the order was paid."
  isDelivered Boolean "A flag indicating if the order has been delivered. Defaults to false."
  deliveredAt Date "The timestamp when the order was delivered."
}


# ====================================================================================================
# SECTION 3: FITNESS & HEALTH TRACKING
# This section defines all the models used by users to track their daily activities and progress.
# All data here is directly linked to a specific user.
# ====================================================================================================

exercises [icon: activity, color: red] {
  id ObjectId pk "The unique identifier for an exercise definition."
  name String "The name of the exercise, must be unique. Required."
  description String "A detailed description of the exercise. Required."
  bodyPart String "The primary body part targeted, e.g., 'Chest', 'Back'."
  category String "The category of exercise, e.g., 'Strength', 'Cardio'."
  videoUrl String "A URL to a video demonstrating the exercise."
  difficulty String "The difficulty level: 'Beginner', 'Intermediate', 'Advanced'."
  equipment [String] "A list of equipment needed for the exercise."
  user ObjectId "A reference to the 'User' who created this exercise definition (typically an admin)."
  isPublic Boolean "A flag to make this exercise available to all users. Defaults to true."
}

workoutSessions [icon: clipboard-list, color: red] {
  id ObjectId pk "The unique identifier for a planned workout session."
  user ObjectId "A reference to the 'User' who owns this workout session. Required."
  name String "The name of the workout session, e.g., 'Leg Day'. Required."
  description String "A description of the workout session."
  exercises [object] "A list of exercises planned for the session. Each entry references an 'Exercise' and includes details like sets, reps, weight, and rest period."
  estimatedDuration Number "The estimated duration of the session in minutes."
  isTemplate Boolean "A flag to indicate if this session is a reusable template. Defaults to false."
}

workoutEntries [icon: file-check, color: red] {
  id ObjectId pk "The unique identifier for a completed workout entry."
  user ObjectId "A reference to the 'User' who completed the workout. Required."
  session ObjectId "A reference to the 'WorkoutSession' that was performed."
  date Date "The date the workout was completed. Defaults to the current time."
  duration Number "The actual duration of the workout in minutes."
  exercises [object] "A detailed log of the exercises that were actually performed, including the sets completed with reps and weight for each."
  notes String "Any personal notes the user made about the workout."
  satisfaction Number "The user's self-reported satisfaction with the workout, on a scale of 1-5."
}

dietEntries [icon: apple, color: lime] {
  id ObjectId pk "The unique identifier for a diet entry."
  user ObjectId "A reference to the 'User' who owns this diet entry. Required."
  date Date "The date of the meal. Defaults to the current time. Required."
  mealType String "The type of meal, e.g., 'Breakfast', 'Lunch', 'Dinner', 'Snack'."
  foodItems [object] "A list of food items consumed. Each item includes name, quantity, and detailed nutritional info (calories, protein, carbs, fat)."
  totalCalories Number "The calculated total calories for the entry. Required."
  totalProtein Number "The calculated total protein for the entry."
  totalCarbs Number "The calculated total carbs for the entry."
  totalFat Number "The calculated total fat for the entry."
  notes String "Any personal notes about the meal."
  image String "A URL to an image of the meal, uploaded by the user."
}

sleep [icon: moon, color: indigo] {
  id ObjectId pk "The unique identifier for a sleep entry."
  user ObjectId "A reference to the 'User' who owns this sleep entry. Required."
  date Date "The date of the sleep entry. Must be unique for the user. Required."
  duration Number "The duration of sleep in hours. Required."
  quality Number "The user's self-reported sleep quality, on a scale of 1-5. Required."
  notes String "Any personal notes about their sleep."
}

waterTrackings [icon: glass-water, color: cyan] {
  id ObjectId pk "The unique identifier for a day's water tracking."
  user ObjectId "A reference to the 'User' who owns this water tracking entry. Required."
  date Date "The date of the water tracking. Must be unique for the user. Required."
  amount Number "The total amount of water consumed in milliliters (ml). Required."
  goal Number "The user's daily water intake goal in ml. Defaults to 2000."
  entries [object] "A list of individual water intake entries, each with an amount and a timestamp."
}

weights [icon: weight, color: gray] {
  id ObjectId pk "The unique identifier for a weight entry."
  user ObjectId "A reference to the 'User' who owns this weight entry. Required."
  date Date "The date the weight was recorded. Must be unique for the user. Required."
  weight Number "The user's body weight. Required."
  unit String "The unit of weight, can be 'kg' or 'lbs'. Required."
  notes String "Any personal notes about the weight entry."
}


# ====================================================================================================
# SECTION 4: SYSTEM & UTILITY MODELS
# This section defines models used for administrative, system-wide, or utility purposes.
# They are not typically directly manipulated by regular users.
# ====================================================================================================

quizzes [icon: help-circle, color: yellow] {
  id ObjectId pk "The unique identifier for a quiz."
  title String "The title of the quiz, must be unique. Required."
  description String "A description of the quiz."
  questions [object] "A list of questions in the quiz. Each question has text, type (e.g., multiple-choice), options, and a required flag."
  assignedCollections [object] "Rules to assign a 'Collection' to a user based on their answers."
  isActive Boolean "A flag to enable or disable the quiz. Defaults to true."
  createdBy ObjectId "A reference to the 'User' (admin) who created the quiz."
}

systemSettings [icon: settings, color: gray] {
  id ObjectId pk "The unique identifier for a system setting."
  settingName String "The name of the setting, must be unique (e.g., 'MaintenanceMode'). Required."
  value object "The value of the setting. It can be any data type (boolean, string, object), making it very flexible."
  description String "An explanation of what this setting controls."
  isPublic Boolean "Determines if this setting's value can be read by the frontend application. Defaults to false."
  lastModifiedBy ObjectId "A reference to the 'User' (admin) who last changed this setting."
}

messageTemplates [icon: message-square, color: orange] {
  id ObjectId pk "The unique identifier for a message template."
  name String "The name of the template, must be unique. Required."
  subject String "The subject line for emails."
  body String "The main content of the message. Can contain variables (e.g., Handlebars syntax) to personalize it. Required."
  type String "The type of message, e.g., 'email', 'sms', 'push'. Required."
  language String "The language of the template, e.g., 'en'. Defaults to 'en'."
  isPublic Boolean "A flag for whether this template is widely available. Defaults to true."
  createdBy ObjectId "A reference to the 'User' (admin) who created the template."
}

oneTimeCodes [icon: key, color: yellow] {
  id ObjectId pk "The unique identifier for a one-time use code."
  code String "The actual code string, must be unique. Required."
  collectionId ObjectId "A reference to the 'Collection' this code grants access to. Required."
  collectionName String "The name of the collection (denormalized for easy display). Required."
  createdBy ObjectId "A reference to the 'User' (admin) who created this code. Required."
  isUsed Boolean "A simple flag for single-use codes to show if they've been used. Defaults to false."
  usedBy ObjectId "A reference to the 'User' who last used this code."
  usedAt Date "The timestamp of the last time this code was used."
  maxUses Number "The maximum number of times this code can be used. Defaults to 1."
  currentUses Number "How many times this code has already been used. Defaults to 0."
  usageHistory [object] "A detailed log of every time this code was used, including who used it, when, and from what IP address."
  isUniversal Boolean "A flag to indicate if this is a universal code that many people can use (if maxUses > 1). Defaults to false."
  expiresAt Date "The date and time when this code will expire."
}

# ====================================================================================================
# SECTION 5: RELATIONSHIPS
# This section visually defines the connections between the models described above.
# The '>' symbol indicates a "one-to-many" or "one-to-one" relationship (e.g., one user has many orders).
# ====================================================================================================

# --- User Relationships ---
# Explains how the User model connects to other data.
users.adminNotes.createdBy > users.id "An admin user creates notes on another user's profile."
users.contactHistory.contactedBy > users.id "An admin user is the one who contacts a user."
users.timeFrame.timeFrameSetBy > users.id "An admin user is the one who sets a time frame for a user."
users.timeFrameHistory.setBy > users.id "An admin user created a historical time frame entry."
users.timeFrameHistory.replacedBy > users.id "An admin user replaced an old time frame."
users.assignedCollections.collectionId > collections.id "A user's assigned collection links to a master collection."
users.assignedCollections.assignedBy > users.id "An admin user is the one who assigns a collection."
users.accessedCollections.collectionId > collections.id "A user's accessed collection links to a master collection."
users.lockedCollections.collectionId > collections.id "A user's locked collection links to a master collection."

# --- Content Relationships ---
# Explains how content models are connected.
collections.user > users.id "A collection is created by a user (admin)."
collections.parentCollection > collections.id "A collection can have a parent collection."
collections.products.product > products.id "A collection contains many products."
products.user > users.id "A product is created by a user (admin)."
products.reviews.user > users.id "A review on a product is written by a user."
products.alternatives > products.id "A product can have alternative products."
orders.user > users.id "An order is placed by a user."
orders.orderItems.product > products.id "An item in an order refers to a specific product."

# --- Tracking Relationships ---
# Explains how user tracking data is linked.
exercises.user > users.id "An exercise definition is created by a user (admin)."
workoutSessions.user > users.id "A workout session plan belongs to a user."
workoutSessions.exercises.exercise > exercises.id "A planned exercise in a session refers to an exercise definition."
workoutEntries.user > users.id "A completed workout entry belongs to a user."
workoutEntries.session > workoutSessions.id "A completed workout entry is an instance of a planned session."
workoutEntries.exercises.exercise > exercises.id "A completed exercise refers to an exercise definition."
dietEntries.user > users.id "A diet entry belongs to a user."
sleep.user > users.id "A sleep entry belongs to a user."
waterTrackings.user > users.id "A water tracking entry belongs to a user."
weights.user > users.id "A weight entry belongs to a user."

# --- System Relationships ---
# Explains how system-level models are connected.
quizzes.createdBy > users.id "A quiz is created by a user (admin)."
quizzes.assignedCollections.collectionId > collections.id "A quiz can assign a collection to a user."
systemSettings.lastModifiedBy > users.id "A system setting is modified by a user (admin)."
messageTemplates.createdBy > users.id "A message template is created by a user (admin)."
oneTimeCodes.collectionId > collections.id "A one-time code provides access to a specific collection."
oneTimeCodes.createdBy > users.id "A one-time code is created by a user (admin)."
oneTimeCodes.usedBy > users.id "A one-time code is used by a user."
oneTimeCodes.usageHistory.usedBy > users.id "A usage history entry tracks which user used the code."

</rewritten_file> 