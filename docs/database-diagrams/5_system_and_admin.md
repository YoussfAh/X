# ERASER.IO DIAGRAM: 5. SYSTEM & ADMIN
# This diagram outlines the models used for administrative purposes and global application configuration.
# These are typically managed by admins and affect the entire system's behavior.

# The User model is included for context, as admins are users with special privileges.
users [icon: user, color: blue] {
  id ObjectId pk
  name String
  email String
  isAdmin Boolean
}

# --- System & Utility Models ---

# The Quiz model allows admins to create dynamic quizzes, such as the initial user assessment.
quizzes [icon: help-circle, color: yellow] {
  id ObjectId pk
  title String "required, unique"
  description String
  questions [object] "{ questionText: String, questionType: String, options: [String], isRequired: Boolean }"
  assignedCollections [object] "{ answers: [String], collectionId: ObjectId }"
  isActive Boolean "default: true"
  createdBy ObjectId "ref: 'User'"
}

# A flexible model for storing any kind of global setting, like feature flags or UI configurations.
# This prevents hard-coding values and allows for dynamic updates.
systemSettings [icon: settings, color: gray] {
  id ObjectId pk
  settingName String "required, unique (e.g., 'MainHeroCarousel', 'MaintenanceMode')"
  value object "Can be any type: JSON object, string, boolean, etc."
  description String "Explains what this setting controls"
  isPublic Boolean "Is this setting readable by front-end clients? default: false"
  lastModifiedBy ObjectId "ref: 'User'"
}

# Reusable templates for sending communications (email, SMS, etc.).
# This allows for consistent messaging and easy updates.
messageTemplates [icon: message-square, color: orange] {
  id ObjectId pk
  name String "required, unique"
  subject String
  body String "required, can use template syntax like Handlebars"
  type String "enum: ['email', 'sms', 'push'], required"
  language String "default: 'en'"
  isPublic Boolean "default: true"
  createdBy ObjectId "ref: 'User'"
}

# The collection model is referenced by the quiz for assigning content based on answers.
collections [icon: folder-open, color: purple] {
  id ObjectId pk
  name String
}


# --- RELATIONSHIPS ---

# An admin user creates a quiz.
quizzes.createdBy > users.id

# A quiz can be configured to assign a collection based on a user's answers.
quizzes.assignedCollections.collectionId > collections.id

# An admin user is tracked as the last person to modify a system setting.
systemSettings.lastModifiedBy > users.id

# An admin user creates a message template.
messageTemplates.createdBy > users.id 