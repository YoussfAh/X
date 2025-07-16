import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  assignCollection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: false,
  },
});

const assignmentRuleConditionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

const assignmentRuleSchema = new mongoose.Schema({
  conditions: [assignmentRuleConditionSchema],
  assignCollection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true,
  },
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'true-false', 'text', 'informational'],
    default: 'multiple-choice',
  },
  options: [optionSchema],
});

const quizSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      default: 'Onboarding Quiz',
    },
    questions: [questionSchema],
    assignmentRules: [assignmentRuleSchema],
    backgroundUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggerType: {
      type: String,
      enum: ['TIME_INTERVAL', 'ADMIN_ASSIGNMENT'],
      default: 'ADMIN_ASSIGNMENT',
    },
    triggerDelayDays: {
      type: Number,
      default: 0, // In days
    },
    triggerDelayAmount: {
      type: Number,
      default: 0,
    },
    triggerDelayUnit: {
      type: String,
      enum: ['seconds', 'minutes', 'hours', 'days', 'weeks'],
      default: 'days',
    },
    triggerStartFrom: {
      type: String,
      enum: ['REGISTRATION', 'FIRST_QUIZ', 'LAST_QUIZ'],
      default: 'REGISTRATION',
    },
    timeFrameHandling: {
      type: String,
      enum: ['RESPECT_TIMEFRAME', 'ALL_USERS', 'OUTSIDE_TIMEFRAME_ONLY'],
      default: 'RESPECT_TIMEFRAME',
    },
    respectUserTimeFrame: {
      type: Boolean,
      default: true,
    },
    homePageMessage: {
      type: String,
      default: 'You have a new quiz available! Take it now to get your personalized plan.',
    },
    completionMessage: {
      type: String,
      default: 'Thank you for completing the quiz! Your responses have been saved and your profile is being updated.',
    },
    assignmentDelaySeconds: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;