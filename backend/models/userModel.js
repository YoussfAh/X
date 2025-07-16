import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define a schema for accessed collections
const accessedCollectionSchema = mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    firstAccessedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    accessCount: {
      type: Number,
      default: 1,
    },
    accessedWithCode: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Define a schema for assigned collections (collections that admins specifically assign to users)
const assignedCollectionSchema = mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '/images/sample.jpg',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  { _id: false }
);

// Define a schema for locked collections
const lockedCollectionSchema = mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Time Frame History Schema - Track all previous time frame settings
const timeFrameHistorySchema = mongoose.Schema({
  startDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  durationType: {
    type: String,
    enum: ['days', 'months'],
    default: 'days',
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false, // Whether this time frame is currently active
  },
  wasWithinTimeFrame: {
    type: Boolean,
    default: false, // Final status when this time frame ended
  },
  setAt: {
    type: Date,
    default: Date.now,
  },
  setBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  // Track when this time frame was replaced/ended
  replacedAt: {
    type: Date,
    default: null,
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
});

const quizAnswerSchema = mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    questionType: { type: String, required: true },
  },
  { _id: false }
);

const quizResultSchema = mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  quizName: {
    type: String,
    required: true,
  },
  answers: [quizAnswerSchema],
  assignedCollections: [
    {
      collectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Collection',
      },
      collectionName: String,
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

const pendingQuizSchema = mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignmentType: {
    type: String,
    enum: ['ADMIN_MANUAL', 'TIME_INTERVAL', 'SYSTEM_AUTO'],
    default: 'ADMIN_MANUAL',
  },
  scheduledFor: {
    type: Date, // When the quiz should become available
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const userSchema = mongoose.Schema(
  {
    // Tenant Association
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null, // Allow null for main app users
      required: false // Make optional - validation handled in middleware
    },
    
    // Account Information
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password required only if not using Google auth
      },
    },
    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    whatsAppPhoneNumber: {
      type: String,
      default: '',
    },
    // Admin Contact Tracking (Legacy - keeping for compatibility)
    lastContactedAt: {
      type: Date,
      default: null,
    },
    lastContactedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    contactNotes: {
      type: String,
      default: '',
    },

    // Contact History - Full history of all admin contacts
    contactHistory: [
      {
        contactedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        contactedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        contactType: {
          type: String,
          enum: ['phone', 'email', 'whatsapp', 'in-person', 'other'],
          default: 'other',
        },
        notes: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['completed', 'follow-up-needed', 'no-response', 'resolved'],
          default: 'completed',
        },
        isActive: {
          type: Boolean,
          default: true, // For soft deletion of contact entries
        },
        tags: [
          {
            type: String,
            trim: true,
          },
        ],
        duration: {
          type: Number, // Duration in minutes
          default: null,
        },
        outcome: {
          type: String,
          default: '',
        },
        followUpDate: {
          type: Date,
          default: null,
        },
        // Additional metadata
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
        },
      },
    ],

    // Admin Notes - A log of notes added by admins
    adminNotes: [
      {
        note: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Social Media Fields
    instagramUsername: {
      type: String,
      default: '',
    },
    facebookProfile: {
      type: String,
      default: '',
    },
    twitterUsername: {
      type: String,
      default: '',
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    isSuperAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    // AI Analysis Access Control
    aiAnalysisEnabled: {
      type: Boolean,
      default: false,
    },

    // Login Security Fields
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    lastLoginAttempt: {
      type: Date,
      default: null,
    },
    registrationIP: {
      type: String,
      default: null,
    },
    lastTokenIssuedAt: {
      type: Date,
      default: Date.now,
    },
    sessionId: {
      type: String,
      default: null,
    },
    lastDeviceId: {
      type: String,
      default: null,
    },

    // Per-device login attempt tracking
    deviceLoginAttempts: {
      type: Map,
      of: {
        attempts: Number,
        lockUntil: Date,
        lastAttempt: Date,
      },
      default: new Map(),
    },

    // Fitness Profile Information
    age: {
      type: Number,
      default: null,
    },
    fitnessGoal: {
      type: String,
      enum: [
        'gain weight',
        'lose weight',
        'build muscle',
        'get lean',
        'maintain',
        'other',
        null, // Allow null value explicitly
      ],
      default: null,
    },
    injuries: {
      type: String,
      default: '',
    },
    additionalInfo: {
      type: String,
      default: '',
    },

    // Collection access tracking
    accessedCollections: [accessedCollectionSchema],

    // Assigned collections
    assignedCollections: [assignedCollectionSchema],

    // Locked collections
    lockedCollections: [lockedCollectionSchema],

    // Time Frame Management - Added for admin control
    // These methods handle automatic calculation of time frames and status updates

    // This feature allows admins to set a specific time period for users
    // The system automatically calculates end dates and tracks whether users are within their time frame
    // This can be used for subscription periods, trial periods, or any time-based access control

    // Time Frame History - Array to store all previous time frame settings
    timeFrameHistory: [timeFrameHistorySchema],

    timeFrame: {
      startDate: {
        type: Date,
        default: null,
      },
      duration: {
        type: Number, // Duration in days or months
        default: null,
      },
      durationType: {
        type: String,
        enum: ['days', 'months'],
        default: 'days',
      },
      endDate: {
        type: Date,
        default: null, // Automatically calculated from startDate + duration
      },
      isWithinTimeFrame: {
        type: Boolean,
        default: false, // Automatically calculated based on current date vs start/end dates
      },
      // Optional: tracking for when time frame was set/modified
      timeFrameSetAt: {
        type: Date,
        default: null,
      },
      timeFrameSetBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Which admin set this time frame
      },
    },

    carouselSlides: [
      {
        image: {
          type: String,
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
        isExternal: {
          type: Boolean,
          default: false,
        },
        alt: {
          type: String,
          required: true,
        },
      },
    ],

    isSystem: {
      type: Boolean,
      default: false,
    },

    quizResults: [quizResultSchema],
    pendingQuizzes: [pendingQuizSchema],

    // Skipped quizzes - used to prevent future auto-assignment of specific TIME_INTERVAL quizzes
    skippedQuizzes: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Quiz',
          required: true,
        },
        skippedAt: {
          type: Date,
          default: Date.now,
        },
        skippedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          default: 'Admin removed future assignment',
        },
      },
    ],

    // User preferences for dismissing banners/notifications
    preferences: {
      quizBannerDismissed: {
        type: Boolean,
        default: false,
      },
      dismissedAt: {
        type: Date,
        default: null,
      },
    },

    // Feature Flags - Admin controlled features
    featureFlags: {
      uploadMealImage: {
        type: Boolean,
        default: false,
      },
      aiAnalysis: {
        type: Boolean,
        default: false,
      },
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure feature flags are initialized
userSchema.pre('save', function (next) {
  if (!this.featureFlags) {
    this.featureFlags = {
      uploadMealImage: false,
      aiAnalysis: false,
    };
  }
  next();
});

// Post-find middleware to initialize feature flags for existing users
userSchema.post(['find', 'findOne', 'findOneAndUpdate'], function (docs) {
  if (!docs) return;
  
  const docsArray = Array.isArray(docs) ? docs : [docs];
  docsArray.forEach(doc => {
    if (doc && !doc.featureFlags) {
      doc.featureFlags = {
        uploadMealImage: false,
        aiAnalysis: false,
      };
    }
  });
});

// Pre-save middleware to validate and clean assigned collections
userSchema.pre('save', async function (next) {
  // Only run this if assignedCollections is modified
  if (!this.isModified('assignedCollections')) {
    return next();
  }

  // Ensure assignedCollections is an array
  if (!Array.isArray(this.assignedCollections)) {
    this.assignedCollections = [];
  }

  // Filter out invalid entries and ensure required fields
  this.assignedCollections = this.assignedCollections.filter(collection => {
    return (
      collection &&
      collection.collectionId &&
      collection.name &&
      collection.assignedBy &&
      collection.status === 'active' // Only keep active collections
    );
  });

  // Remove duplicates based on collectionId
  const seen = new Set();
  this.assignedCollections = this.assignedCollections.filter(collection => {
    const duplicate = seen.has(collection.collectionId.toString());
    seen.add(collection.collectionId.toString());
    return !duplicate;
  });

  next();
});

// Pre-save hook to protect timeFrameHistory from accidental deletion
userSchema.pre('save', function (next) {
  // CRITICAL: Protect timeFrameHistory from being accidentally cleared or modified
  // This ensures audit trail integrity and prevents data loss

  if (this.isModified('timeFrameHistory')) {
    // Get original document to compare
    if (this.isNew) {
      // New document - allow timeFrameHistory initialization
      next();
      return;
    }

    // For existing documents, prevent manual deletion of timeFrameHistory entries
    // Only allow additions through the official updateTimeFrame method
    const original = this.$__.originalValues?.timeFrameHistory;

    if (
      original &&
      Array.isArray(original) &&
      Array.isArray(this.timeFrameHistory)
    ) {
      // Ensure we're not losing any existing history entries
      if (this.timeFrameHistory.length < original.length) {
        console.warn(
          '⚠️  AUDIT TRAIL PROTECTION: Attempt to delete timeFrameHistory entries blocked'
        );
        // Restore original timeFrameHistory to prevent deletion
        this.timeFrameHistory = original;
      }
    }
  }

  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if device is locked due to too many failed attempts
userSchema.methods.isDeviceLocked = function (deviceId) {
  // If no device ID is provided, return false
  if (!deviceId) return false;

  // Check if this device has any login attempts recorded
  if (!this.deviceLoginAttempts.has(deviceId)) return false;

  // Get the device's login attempts data
  const deviceData = this.deviceLoginAttempts.get(deviceId);

  // Check if lockUntil is set and if the lock time has expired
  return !!(deviceData.lockUntil && deviceData.lockUntil > Date.now());
};

// Handle failed login attempt for a specific device
userSchema.methods.incrementDeviceLoginAttempts = async function (deviceId) {
  if (!deviceId) return this.save();

  // Get current device data or create new entry
  let deviceData = this.deviceLoginAttempts.has(deviceId)
    ? this.deviceLoginAttempts.get(deviceId)
    : { attempts: 0, lockUntil: null, lastAttempt: null };

  // Reset login attempts if lock has expired
  if (deviceData.lockUntil && deviceData.lockUntil < Date.now()) {
    deviceData = {
      attempts: 1,
      lockUntil: null,
      lastAttempt: Date.now(),
    };
  } else {
    // Increment login attempts
    deviceData.attempts += 1;
    deviceData.lastAttempt = Date.now();

    // Lock the device if more than 25 attempts
    if (deviceData.attempts >= 25) {
      // Lock for 5 minutes (300000 ms)
      deviceData.lockUntil = Date.now() + 300000;
    }
  }

  // Update the device data in the Map
  this.deviceLoginAttempts.set(deviceId, deviceData);

  return this.save();
};

// Reset login attempts for a specific device after successful login
userSchema.methods.resetDeviceLoginAttempts = function (deviceId) {
  if (deviceId && this.deviceLoginAttempts.has(deviceId)) {
    const deviceData = {
      attempts: 0,
      lockUntil: null,
      lastAttempt: Date.now(),
    };
    this.deviceLoginAttempts.set(deviceId, deviceData);
  }
  return this.save();
};

// ==================== CONTACT HISTORY METHODS ====================

// Add a new contact entry to the history
userSchema.methods.addContactEntry = function (contactData, adminId) {
  const contactEntry = {
    contactedAt: contactData.contactedAt || new Date(),
    contactedBy: adminId,
    contactType: contactData.contactType || 'other',
    notes: contactData.notes || '',
    status: contactData.status || 'completed',
    tags: contactData.tags || [],
    duration: contactData.duration || null,
    outcome: contactData.outcome || '',
    followUpDate: contactData.followUpDate || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  this.contactHistory.push(contactEntry);

  // Update legacy fields for backward compatibility
  this.lastContactedAt = contactEntry.contactedAt;
  this.lastContactedBy = adminId;
  if (contactData.notes) {
    this.contactNotes = contactData.notes;
  }

  return contactEntry;
};

// Update an existing contact entry
userSchema.methods.updateContactEntry = function (
  contactId,
  updateData,
  adminId
) {
  const contactEntry = this.contactHistory.id(contactId);
  if (!contactEntry) {
    throw new Error('Contact entry not found');
  }

  // Update fields if provided
  if (updateData.notes !== undefined) contactEntry.notes = updateData.notes;
  if (updateData.status !== undefined) contactEntry.status = updateData.status;
  if (updateData.contactType !== undefined)
    contactEntry.contactType = updateData.contactType;
  if (updateData.tags !== undefined) contactEntry.tags = updateData.tags;
  if (updateData.duration !== undefined)
    contactEntry.duration = updateData.duration;
  if (updateData.outcome !== undefined)
    contactEntry.outcome = updateData.outcome;
  if (updateData.followUpDate !== undefined)
    contactEntry.followUpDate = updateData.followUpDate;

  contactEntry.updatedAt = new Date();
  contactEntry.updatedBy = adminId;

  // Update legacy notes if this is the most recent contact
  const mostRecentContact = this.getMostRecentContact();
  if (mostRecentContact && mostRecentContact._id.equals(contactEntry._id)) {
    this.contactNotes = contactEntry.notes;
  }

  return contactEntry;
};

// Soft delete a contact entry
userSchema.methods.deleteContactEntry = function (contactId, adminId) {
  const contactEntry = this.contactHistory.id(contactId);
  if (!contactEntry) {
    throw new Error('Contact entry not found');
  }

  contactEntry.isActive = false;
  contactEntry.updatedAt = new Date();
  contactEntry.updatedBy = adminId;

  return contactEntry;
};

// Get contact history sorted by most recent first
userSchema.methods.getContactHistory = function (options = {}) {
  const {
    includeInactive = false,
    limit = null,
    contactType = null,
    status = null,
  } = options;

  let contacts = [...this.contactHistory];

  // Filter by active status
  if (!includeInactive) {
    contacts = contacts.filter((contact) => contact.isActive !== false);
  }

  // Filter by contact type
  if (contactType) {
    contacts = contacts.filter(
      (contact) => contact.contactType === contactType
    );
  }

  // Filter by status
  if (status) {
    contacts = contacts.filter((contact) => contact.status === status);
  }

  // Sort by most recent first
  contacts.sort((a, b) => new Date(b.contactedAt) - new Date(a.contactedAt));

  // Apply limit if specified
  if (limit && limit > 0) {
    contacts = contacts.slice(0, limit);
  }

  return contacts;
};

// Get the most recent contact entry
userSchema.methods.getMostRecentContact = function () {
  const activeContacts = this.getContactHistory({ limit: 1 });
  return activeContacts.length > 0 ? activeContacts[0] : null;
};

// Get contacts that need follow-up
userSchema.methods.getContactsNeedingFollowUp = function () {
  const now = new Date();
  return this.contactHistory.filter(
    (contact) =>
      contact.isActive !== false &&
      contact.followUpDate &&
      contact.followUpDate <= now &&
      contact.status !== 'resolved'
  );
};

// Get contact summary statistics
userSchema.methods.getContactStats = function () {
  const activeContacts = this.getContactHistory();

  const stats = {
    totalContacts: activeContacts.length,
    contactsByType: {},
    contactsByStatus: {},
    averageDuration: 0,
    totalDuration: 0,
    lastContactDate: null,
    needsFollowUp: this.getContactsNeedingFollowUp().length,
  };

  let totalDurationSum = 0;
  let contactsWithDuration = 0;

  activeContacts.forEach((contact) => {
    // Count by type
    stats.contactsByType[contact.contactType] =
      (stats.contactsByType[contact.contactType] || 0) + 1;

    // Count by status
    stats.contactsByStatus[contact.status] =
      (stats.contactsByStatus[contact.status] || 0) + 1;

    // Calculate duration stats
    if (contact.duration && contact.duration > 0) {
      totalDurationSum += contact.duration;
      contactsWithDuration++;
    }
  });

  if (contactsWithDuration > 0) {
    stats.averageDuration = Math.round(totalDurationSum / contactsWithDuration);
    stats.totalDuration = totalDurationSum;
  }

  // Get last contact date
  const mostRecent = this.getMostRecentContact();
  if (mostRecent) {
    stats.lastContactDate = mostRecent.contactedAt;
  }

  return stats;
};

// Clear all contact notes (while keeping contact history)
userSchema.methods.clearContactNotes = function () {
  this.contactNotes = '';
  // Note: This doesn't clear notes from individual contact history entries
  // Use updateContactEntry() to clear notes from specific entries
};

// ==================== TIME FRAME METHODS ====================

// Update time frame with new start date and duration
// Automatically calculates end date and updates status
// Options: { override: boolean, notes: string }
userSchema.methods.updateTimeFrame = function (
  startDate,
  duration,
  durationType,
  adminId,
  options = {}
) {
  const { override = false, notes = '' } = options;

  // If there's an existing active time frame and not overriding, save it to history first
  if (this.timeFrame.startDate && this.timeFrame.duration && !override) {
    this.saveCurrentTimeFrameToHistory(adminId);
  } else if (this.timeFrame.startDate && this.timeFrame.duration && override) {
    // Mark current active history entry as replaced if overriding
    this.markCurrentTimeFrameAsReplaced(adminId);
  }

  this.timeFrame.startDate = startDate;
  this.timeFrame.duration = duration;
  this.timeFrame.durationType = durationType || 'days';

  // Calculate end date based on start date, duration, and duration type
  if (startDate && duration) {
    const endDate = new Date(startDate);
    if (durationType === 'months') {
      endDate.setMonth(endDate.getMonth() + duration);
    } else {
      // Default to days
      endDate.setDate(endDate.getDate() + duration);
    }
    this.timeFrame.endDate = endDate;
  } else {
    this.timeFrame.endDate = null;
  }

  // Set tracking info
  this.timeFrame.timeFrameSetAt = new Date();
  this.timeFrame.timeFrameSetBy = adminId;

  // Update time frame status
  this.updateTimeFrameStatus();

  // Add new time frame to history
  if (startDate && duration) {
    this.timeFrameHistory.push({
      startDate: this.timeFrame.startDate,
      duration: this.timeFrame.duration,
      durationType: this.timeFrame.durationType,
      endDate: this.timeFrame.endDate,
      isActive: true,
      setAt: this.timeFrame.timeFrameSetAt,
      setBy: adminId,
      notes: notes,
    });
  }

  return this;
};

// Check if user is currently within their time frame
// This method can be called periodically to update status
userSchema.methods.updateTimeFrameStatus = function () {
  const now = new Date();
  const startDate = this.timeFrame.startDate;
  const endDate = this.timeFrame.endDate;

  // Check if current date is within the time frame
  if (startDate && endDate) {
    this.timeFrame.isWithinTimeFrame = now >= startDate && now <= endDate;
  } else {
    this.timeFrame.isWithinTimeFrame = false;
  }

  return this.timeFrame.isWithinTimeFrame;
};

// Helper method to save current time frame to history
userSchema.methods.saveCurrentTimeFrameToHistory = function (adminId) {
  if (this.timeFrame.startDate && this.timeFrame.duration) {
    // Mark any existing active history entries as inactive
    this.timeFrameHistory.forEach((entry) => {
      if (entry.isActive) {
        entry.isActive = false;
        entry.wasWithinTimeFrame = this.timeFrame.isWithinTimeFrame;
      }
    });

    // Add current time frame to history
    this.timeFrameHistory.push({
      startDate: this.timeFrame.startDate,
      duration: this.timeFrame.duration,
      durationType: this.timeFrame.durationType,
      endDate: this.timeFrame.endDate,
      isActive: false,
      wasWithinTimeFrame: this.timeFrame.isWithinTimeFrame,
      setAt: this.timeFrame.timeFrameSetAt,
      setBy: this.timeFrame.timeFrameSetBy,
      replacedAt: new Date(),
      replacedBy: adminId,
    });
  }
};

// Helper method to mark current time frame as replaced in history
userSchema.methods.markCurrentTimeFrameAsReplaced = function (adminId) {
  // Find and update the currently active history entry
  const activeEntry = this.timeFrameHistory.find((entry) => entry.isActive);
  if (activeEntry) {
    activeEntry.isActive = false;
    activeEntry.wasWithinTimeFrame = this.timeFrame.isWithinTimeFrame;
    activeEntry.replacedAt = new Date();
    activeEntry.replacedBy = adminId;
  }
};

// Get time frame history sorted by most recent first
userSchema.methods.getTimeFrameHistory = function () {
  return this.timeFrameHistory.sort(
    (a, b) => new Date(b.setAt) - new Date(a.setAt)
  );
};

// DEPRECATED: Keep for backward compatibility but will be replaced by device-specific methods
userSchema.methods.isLocked = function () {
  // Check if lockUntil is set and if the lock time has expired
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// DEPRECATED: Keep for backward compatibility but will be replaced by device-specific methods
userSchema.methods.incrementLoginAttempts = async function () {
  // Reset login attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
    this.lastLoginAttempt = Date.now();
    return this.save();
  }

  // Increment login attempts
  this.loginAttempts += 1;
  this.lastLoginAttempt = Date.now();

  // Lock the account if more than 25 attempts
  if (this.loginAttempts >= 25) {
    // Lock for 5 minutes (300000 ms)
    this.lockUntil = Date.now() + 300000;
  }

  return this.save();
};

// DEPRECATED: Keep for backward compatibility but will be replaced by device-specific methods
userSchema.methods.resetLoginAttempts = function () {
  this.loginAttempts = 0;
  this.lockUntil = null;
  return this.save();
};

// Pre-save hook to clean assignedCollections data
userSchema.pre('save', function (next) {
  // Clean assignedCollections to prevent validation errors
  if (this.assignedCollections && Array.isArray(this.assignedCollections)) {
    this.assignedCollections = this.assignedCollections.filter((collection) => {
      return (
        collection.collectionId && collection.name && collection.assignedBy
      );
    });
  }
  next();
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Create compound unique index for email within tenant
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });

// Method to check if user can access tenant
userSchema.methods.canAccessTenant = function(tenantId) {
  if (this.isSuperAdmin) return true;
  return this.tenantId && this.tenantId.toString() === tenantId.toString();
};

const User = mongoose.model('User', userSchema);

export default User;
