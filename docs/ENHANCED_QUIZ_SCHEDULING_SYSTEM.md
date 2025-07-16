# Enhanced Quiz Scheduling System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Documentation](#api-documentation)
7. [Auto-Assignment Logic](#auto-assignment-logic)
8. [Time Frame Handling](#time-frame-handling)
9. [Code Examples](#code-examples)
10. [Testing Guide](#testing-guide)
11. [Migration Guide](#migration-guide)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Enhanced Quiz Scheduling System is a comprehensive solution that provides flexible, intelligent quiz assignment and scheduling capabilities. It supports timing from 5 seconds to multiple weeks, multiple reference points for trigger calculation, and advanced time frame handling options.

### Key Features
- **Flexible Timing**: Support for seconds, minutes, hours, days, and weeks
- **Multiple Reference Points**: User registration, first quiz completion, last quiz completion
- **Advanced Time Frame Handling**: Respect user timeframes, all users, or outside timeframes only
- **Intelligent Auto-Assignment**: Automated quiz scheduling based on user behavior
- **Backward Compatibility**: Seamless integration with existing quiz system
- **Enhanced Admin UI**: Intuitive controls for scheduling configuration

### System Requirements
- Node.js 18+ with ES modules support
- MongoDB 5.0+
- React.js 18+
- Bootstrap 5+

---

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │  Backend API    │    │   MongoDB       │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼────┐              ┌───▼────┐
    │ Admin   │              │ Quiz   │              │ Quiz   │
    │ Controls│              │Controller│             │ Model  │
    └─────────┘              └────────┘              └────────┘
         │                       │                       │
    ┌────▼────┐              ┌───▼────┐              ┌───▼────┐
    │ Enhanced│              │ Auto   │              │ User   │
    │ Form UI │              │Assignment│             │ Model  │
    └─────────┘              └────────┘              └────────┘
```

### Data Flow
1. **Admin Configuration**: Admin sets quiz scheduling parameters via frontend UI
2. **Database Storage**: Enhanced scheduling fields stored in MongoDB
3. **Auto-Assignment Processing**: Background process evaluates users and assigns quizzes
4. **User Experience**: Users receive quizzes based on intelligent scheduling logic

---

## Database Schema

### Enhanced Quiz Model

```javascript
// Enhanced Quiz Schema with new scheduling fields
const quizSchema = new mongoose.Schema({
  // Basic quiz fields
  name: { type: String, required: true },
  questions: [questionSchema],
  isActive: { type: Boolean, default: true },
  
  // Enhanced Scheduling Fields
  triggerType: {
    type: String,
    enum: ['TIME_INTERVAL', 'ADMIN_ASSIGNMENT'],
    default: 'ADMIN_ASSIGNMENT'
  },
  
  // NEW: Flexible delay amount (replaces fixed days)
  triggerDelayAmount: {
    type: Number,
    default: 0,
    min: 0,
    max: 999999 // Support very large delays
  },
  
  // NEW: Time unit for delay
  triggerDelayUnit: {
    type: String,
    enum: ['seconds', 'minutes', 'hours', 'days', 'weeks'],
    default: 'days'
  },
  
  // NEW: Reference point for delay calculation
  triggerStartFrom: {
    type: String,
    enum: ['REGISTRATION', 'FIRST_QUIZ', 'LAST_QUIZ'],
    default: 'REGISTRATION'
  },
  
  // NEW: Advanced time frame handling
  timeFrameHandling: {
    type: String,
    enum: ['RESPECT_TIMEFRAME', 'ALL_USERS', 'OUTSIDE_TIMEFRAME_ONLY'],
    default: 'RESPECT_TIMEFRAME'
  },
  
  // Legacy fields (maintained for backward compatibility)
  triggerDelayDays: { type: Number, default: 0 },
  respectUserTimeFrame: { type: Boolean, default: true },
  
  // Assignment configuration
  assignmentDelaySeconds: { type: Number, default: 0 },
  homePageMessage: { type: String, default: 'You have a new quiz available!' }
}, {
  timestamps: true
});
```

### User Model Integration

```javascript
// User schema with quiz-related fields
const userSchema = new mongoose.Schema({
  // Basic user info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  // Quiz-related arrays
  pendingQuizzes: [pendingQuizSchema],
  quizResults: [quizResultSchema],
  
  // Time frame configuration
  timeFrame: {
    start: Date,    // e.g., 06:00
    end: Date,      // e.g., 22:00
    active: Boolean
  }
});

// Pending quiz schema
const pendingQuizSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignmentType: {
    type: String,
    enum: ['ADMIN_MANUAL', 'TIME_INTERVAL', 'SYSTEM_AUTO'],
    default: 'ADMIN_MANUAL'
  },
  scheduledFor: Date,
  isAvailable: { type: Boolean, default: true }
});
```

---

## Backend Implementation

### Quiz Controller - Enhanced Logic

```javascript
// Backend: controllers/quizController.js

/**
 * Enhanced Auto-Assignment Function
 * Processes all active time-based quizzes and assigns them to eligible users
 * based on advanced scheduling criteria
 */
const autoAssignQuizzes = asyncHandler(async (req, res) => {
  try {
    console.log('--- Starting automatic quiz assignment process ---');

    // Get system admin user for assignments
    const systemUser = await User.findOne({ isAdmin: true });
    if (!systemUser) {
      throw new Error('No admin user found for system assignments');
    }

    // Find all active time-interval quizzes
    const timeBasedQuizzes = await Quiz.find({ 
      triggerType: 'TIME_INTERVAL', 
      isActive: true 
    });

    console.log(`Found ${timeBasedQuizzes.length} active time-based quizzes`);

    let totalAssigned = 0;

    for (const quiz of timeBasedQuizzes) {
      const users = await User.find({});

      for (const user of users) {
        // Skip admin users for auto-assignment
        if (user.isAdmin) continue;

        // Check if quiz already assigned or completed
        const alreadyAssigned = user.pendingQuizzes.some(
          pendingQuiz => pendingQuiz.quizId.toString() === quiz._id.toString()
        );

        const alreadyCompleted = user.quizResults.some(
          result => result.quizId.toString() === quiz._id.toString()
        );

        if (alreadyAssigned || alreadyCompleted) continue;

        // ENHANCED: Calculate trigger date based on new flexible scheduling
        const now = new Date();
        let referenceDate = new Date(user.createdAt); // Default: registration

        // Determine reference point based on triggerStartFrom
        if (quiz.triggerStartFrom === 'FIRST_QUIZ' && user.quizResults.length > 0) {
          referenceDate = new Date(user.quizResults[0].completedAt);
        } else if (quiz.triggerStartFrom === 'LAST_QUIZ' && user.quizResults.length > 0) {
          const lastQuiz = user.quizResults[user.quizResults.length - 1];
          referenceDate = new Date(lastQuiz.completedAt);
        }

        // ENHANCED: Calculate trigger date using flexible time units
        const triggerDate = new Date(referenceDate);
        const delayAmount = quiz.triggerDelayAmount || quiz.triggerDelayDays || 0;
        
        if (quiz.triggerDelayUnit) {
          // New enhanced delay system
          switch (quiz.triggerDelayUnit) {
            case 'seconds':
              triggerDate.setSeconds(triggerDate.getSeconds() + delayAmount);
              break;
            case 'minutes':
              triggerDate.setMinutes(triggerDate.getMinutes() + delayAmount);
              break;
            case 'hours':
              triggerDate.setHours(triggerDate.getHours() + delayAmount);
              break;
            case 'days':
              triggerDate.setDate(triggerDate.getDate() + delayAmount);
              break;
            case 'weeks':
              triggerDate.setDate(triggerDate.getDate() + (delayAmount * 7));
              break;
          }
        } else {
          // Fallback to legacy system (days)
          triggerDate.setDate(triggerDate.getDate() + delayAmount);
        }

        // Check if it's time to assign
        if (now < triggerDate) continue;

        // ENHANCED: Advanced time frame handling
        let shouldAssign = true;

        if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
          // Only assign if user is within their time frame
          if (user.timeFrame && user.timeFrame.active) {
            const currentHour = now.getHours();
            const startHour = user.timeFrame.start.getHours();
            const endHour = user.timeFrame.end.getHours();
            
            const isInTimeFrame = (startHour <= endHour) 
              ? (currentHour >= startHour && currentHour <= endHour)
              : (currentHour >= startHour || currentHour <= endHour);
            
            if (!isInTimeFrame) {
              console.log(`Skipping quiz "${quiz.name}" for user "${user.email}" - outside time frame`);
              shouldAssign = false;
            }
          }
        } else if (quiz.timeFrameHandling === 'OUTSIDE_TIMEFRAME_ONLY') {
          // Only assign if user is OUTSIDE their time frame
          if (user.timeFrame && user.timeFrame.active) {
            const currentHour = now.getHours();
            const startHour = user.timeFrame.start.getHours();
            const endHour = user.timeFrame.end.getHours();
            
            const isInTimeFrame = (startHour <= endHour) 
              ? (currentHour >= startHour && currentHour <= endHour)
              : (currentHour >= startHour || currentHour <= endHour);
            
            if (isInTimeFrame) shouldAssign = false;
          }
        }
        // For 'ALL_USERS', always assign regardless of time frame

        if (shouldAssign) {
          // Assign the quiz
          user.pendingQuizzes.push({
            quizId: quiz._id,
            assignedAt: new Date(),
            assignedBy: systemUser._id,
            assignmentType: 'TIME_INTERVAL',
            scheduledFor: triggerDate,
            isAvailable: true,
          });

          await user.save();
          totalAssigned++;
          
          console.log(`AUTO-ASSIGNED: Quiz "${quiz.name}" to user "${user.email}"`);
        }
      }
    }

    console.log(`--- Auto-assignment completed. Total assigned: ${totalAssigned} ---`);
    
    if (res && typeof res.status === 'function') {
      res.status(200).json({ 
        message: 'Auto-assignment completed successfully', 
        assignedCount: totalAssigned 
      });
    }

    return { assignedCount: totalAssigned };

  } catch (error) {
    console.error(`[CRITICAL] Auto-assignment failed: ${error.message}`);
    if (res && typeof res.status === 'function') {
      res.status(500);
      throw new Error(`Auto-assignment failed: ${error.message}`);
    }
    throw error;
  }
});
```

### Enhanced Quiz Retrieval Logic

```javascript
/**
 * Get Active Quiz for User with Enhanced Logic
 * Determines which quiz a user should see based on scheduling rules
 */
const getActiveQuizForUser = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    console.log(`--- Getting Active Quiz for User: ${user.email} ---`);

    if (!user.pendingQuizzes || user.pendingQuizzes.length === 0) {
      console.log('No pending quizzes for user.');
      return res.status(200).json(null);
    }

    // Process each pending quiz
    for (const pendingQuiz of user.pendingQuizzes) {
      const quiz = await Quiz.findById(pendingQuiz.quizId);
      
      if (!quiz || !quiz.isActive) {
        console.log(`Skipping inactive quiz: ${quiz?.name}`);
        continue;
      }

      console.log(`\n--- Evaluating quiz: "${quiz.name}" (ID: ${quiz._id}) ---`);
      console.log(`Quiz "${quiz.name}" is active.`);

      // Handle different trigger types
      if (quiz.triggerType === 'ADMIN_ASSIGNMENT') {
        console.log('Quiz trigger type is "ADMIN_ASSIGNMENT". No time interval delay to check.');
        
        // For admin assignments, check time frame if required
        if (quiz.respectUserTimeFrame && user.timeFrame && user.timeFrame.active) {
          const now = new Date();
          const currentHour = now.getHours();
          const startHour = user.timeFrame.start.getHours();
          const endHour = user.timeFrame.end.getHours();
          
          const isInTimeFrame = (startHour <= endHour) 
            ? (currentHour >= startHour && currentHour <= endHour)
            : (currentHour >= startHour || currentHour <= endHour);
          
          if (!isInTimeFrame) {
            console.log('User is outside their allowed time frame.');
            continue;
          }
          
          console.log('User is within their allowed time frame.');
        }
        
        console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
        return res.status(200).json(quiz);
        
      } else if (quiz.triggerType === 'TIME_INTERVAL') {
        console.log('Quiz trigger type is "TIME_INTERVAL". Checking timing and availability.');
        
        // For time-interval quizzes, they should already be properly scheduled
        // by the auto-assignment process, so if they're in pendingQuizzes, they're ready
        
        console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
        return res.status(200).json(quiz);
      }
    }

    console.log('No valid pending quizzes found. Returning null.');
    res.status(200).json(null);

  } catch (error) {
    console.error('Error getting active quiz for user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
```

---

## Frontend Implementation

### Enhanced Admin Quiz Edit Screen

```jsx
// Frontend: screens/admin/AdminQuizEditScreen.jsx

import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminQuizEditScreen = () => {
  const { id } = useParams();

  // Enhanced state variables for new scheduling features
  const [triggerDelayAmount, setTriggerDelayAmount] = useState(0);
  const [triggerDelayUnit, setTriggerDelayUnit] = useState('days');
  const [triggerStartFrom, setTriggerStartFrom] = useState('REGISTRATION');
  const [timeFrameHandling, setTimeFrameHandling] = useState('RESPECT_TIMEFRAME');

  // Load quiz data and populate enhanced fields
  useEffect(() => {
    if (quizData) {
      // Enhanced scheduling fields
      setTriggerDelayAmount(quizData.triggerDelayAmount || 0);
      setTriggerDelayUnit(quizData.triggerDelayUnit || 'days');
      setTriggerStartFrom(quizData.triggerStartFrom || 'REGISTRATION');
      setTimeFrameHandling(quizData.timeFrameHandling || 'RESPECT_TIMEFRAME');
    }
  }, [quizData]);

  // Enhanced form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedQuiz = {
      _id: id,
      name,
      questions: cleanedQuestions,
      backgroundUrl,
      isActive,
      assignmentRules: cleanedRules,
      assignmentDelaySeconds,
      triggerType,
      triggerDelayDays, // Legacy field
      
      // NEW: Enhanced scheduling fields
      triggerDelayAmount,
      triggerDelayUnit,
      triggerStartFrom,
      timeFrameHandling,
      
      respectUserTimeFrame, // Legacy field
      homePageMessage,
    };

    console.log('--- Sending Quiz Update Payload ---');
    console.log(JSON.stringify(updatedQuiz, null, 2));

    try {
      await updateQuiz(updatedQuiz).unwrap();
      toast.success('Quiz updated successfully');
      refetch();
    } catch (err) {
      console.error('QUIZ UPDATE FAILED:', err);
      toast.error(`Failed to update quiz: ${err?.data?.message || 'Unknown error'}`);
    }
  };

  return (
    <Container>
      <Card className="shadow">
        <Card.Header>
          <h2>Edit Quiz: {quizData?.name}</h2>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            
            {/* Enhanced Scheduling Controls - Only show for TIME_INTERVAL */}
            {triggerType === 'TIME_INTERVAL' && (
              <Card className="mb-4">
                <Card.Header>
                  <h5>📅 Enhanced Scheduling Configuration</h5>
                </Card.Header>
                <Card.Body>
                  
                  {/* Flexible Time Delay Input */}
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId='triggerDelayAmount' className='mb-3'>
                        <Form.Label>Delay Amount</Form.Label>
                        <Form.Control
                          type='number'
                          min='0'
                          step='1'
                          value={triggerDelayAmount}
                          onChange={(e) =>
                            setTriggerDelayAmount(Number(e.target.value) || 0)
                          }
                          placeholder='Enter delay amount'
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId='triggerDelayUnit' className='mb-3'>
                        <Form.Label>Time Unit</Form.Label>
                        <Form.Control
                          as='select'
                          value={triggerDelayUnit}
                          onChange={(e) => setTriggerDelayUnit(e.target.value)}
                        >
                          <option value='seconds'>Seconds</option>
                          <option value='minutes'>Minutes</option>
                          <option value='hours'>Hours</option>
                          <option value='days'>Days</option>
                          <option value='weeks'>Weeks</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Reference Point Selection */}
                  <Form.Group controlId='triggerStartFrom' className='mb-3'>
                    <Form.Label>Start Counting From</Form.Label>
                    <Form.Control
                      as='select'
                      value={triggerStartFrom}
                      onChange={(e) => setTriggerStartFrom(e.target.value)}
                    >
                      <option value='REGISTRATION'>User Registration</option>
                      <option value='FIRST_QUIZ'>First Quiz Taken</option>
                      <option value='LAST_QUIZ'>Last Quiz Taken</option>
                    </Form.Control>
                    <Form.Text className='text-muted'>
                      Choose the reference point for when the delay starts counting.
                    </Form.Text>
                  </Form.Group>

                  {/* Time Frame Handling */}
                  <Form.Group controlId='timeFrameHandling' className='mb-3'>
                    <Form.Label>Time Frame Handling</Form.Label>
                    <Form.Control
                      as='select'
                      value={timeFrameHandling}
                      onChange={(e) => setTimeFrameHandling(e.target.value)}
                    >
                      <option value='RESPECT_TIMEFRAME'>
                        Only users within their time frame
                      </option>
                      <option value='ALL_USERS'>
                        All users (ignore time frames)
                      </option>
                      <option value='OUTSIDE_TIMEFRAME_ONLY'>
                        Only users outside their time frame
                      </option>
                    </Form.Control>
                    <Form.Text className='text-muted'>
                      Control when quizzes are assigned based on user time frames.
                    </Form.Text>
                  </Form.Group>

                  {/* Visual Example */}
                  <div className="alert alert-info">
                    <strong>Example:</strong> With current settings, this quiz will be assigned{' '}
                    <strong>{triggerDelayAmount} {triggerDelayUnit}</strong> after{' '}
                    <strong>
                      {triggerStartFrom === 'REGISTRATION' && 'user registration'}
                      {triggerStartFrom === 'FIRST_QUIZ' && 'first quiz completion'}
                      {triggerStartFrom === 'LAST_QUIZ' && 'last quiz completion'}
                    </strong>
                    {timeFrameHandling === 'RESPECT_TIMEFRAME' && ' (only during user time frames)'}
                    {timeFrameHandling === 'OUTSIDE_TIMEFRAME_ONLY' && ' (only outside user time frames)'}
                    {timeFrameHandling === 'ALL_USERS' && ' (regardless of time frames)'}.
                  </div>
                  
                </Card.Body>
              </Card>
            )}

            {/* Legacy Support for ADMIN_ASSIGNMENT */}
            {triggerType === 'ADMIN_ASSIGNMENT' && (
              <Form.Group controlId='respectUserTimeFrame' className='mb-3'>
                <Form.Check
                  type='checkbox'
                  label='Respect User Time Frame'
                  checked={respectUserTimeFrame}
                  onChange={(e) => setRespectUserTimeFrame(e.target.checked)}
                />
                <Form.Text className='text-muted'>
                  For Admin Assignment quizzes, control whether user time frames are respected.
                </Form.Text>
              </Form.Group>
            )}

            {/* Submit Button */}
            <Button variant='primary' type='submit'>
              Update Quiz
            </Button>
            
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminQuizEditScreen;
```

---

## API Documentation

### Quiz API Endpoints

#### Create Quiz
```
POST /api/quiz
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Enhanced Quiz",
  "triggerType": "TIME_INTERVAL",
  "triggerDelayAmount": 15,
  "triggerDelayUnit": "minutes",
  "triggerStartFrom": "FIRST_QUIZ",
  "timeFrameHandling": "RESPECT_TIMEFRAME",
  "questions": [...]
}
```

#### Update Quiz
```
PUT /api/quiz/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "_id": "quiz_id",
  "triggerDelayAmount": 2,
  "triggerDelayUnit": "hours",
  "triggerStartFrom": "LAST_QUIZ",
  "timeFrameHandling": "ALL_USERS"
}
```

#### Auto-Assign Quizzes
```
POST /api/quiz/auto-assign
Authorization: Bearer <admin_token>

Response:
{
  "message": "Auto-assignment completed successfully",
  "assignedCount": 42
}
```

#### Get Active Quiz for User
```
GET /api/quiz/active-for-user
Authorization: Bearer <token>

Response:
{
  "_id": "quiz_id",
  "name": "Quiz Name",
  "questions": [...],
  "triggerType": "TIME_INTERVAL"
}
```

---

## Auto-Assignment Logic

### Processing Flow

```
1. Find all TIME_INTERVAL quizzes where isActive = true
2. For each quiz:
   a. Get all non-admin users
   b. For each user:
      i. Check if quiz already assigned/completed
      ii. Calculate reference date based on triggerStartFrom
      iii. Calculate trigger date using triggerDelayAmount + triggerDelayUnit
      iv. Check if current time >= trigger time
      v. Apply timeFrameHandling logic
      vi. Assign quiz if all conditions met
3. Return total assignment count
```

### Reference Date Calculation

```javascript
// Determine reference date based on triggerStartFrom
let referenceDate;

switch (quiz.triggerStartFrom) {
  case 'REGISTRATION':
    referenceDate = new Date(user.createdAt);
    break;
    
  case 'FIRST_QUIZ':
    if (user.quizResults.length > 0) {
      const sortedResults = user.quizResults.sort(
        (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
      );
      referenceDate = new Date(sortedResults[0].completedAt);
    } else {
      // Fallback to registration if no quizzes completed
      referenceDate = new Date(user.createdAt);
    }
    break;
    
  case 'LAST_QUIZ':
    if (user.quizResults.length > 0) {
      const sortedResults = user.quizResults.sort(
        (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
      );
      referenceDate = new Date(sortedResults[0].completedAt);
    } else {
      // Fallback to registration if no quizzes completed
      referenceDate = new Date(user.createdAt);
    }
    break;
}
```

### Trigger Date Calculation

```javascript
// Calculate trigger date using flexible time units
const triggerDate = new Date(referenceDate);
const delayAmount = quiz.triggerDelayAmount || 0;

switch (quiz.triggerDelayUnit) {
  case 'seconds':
    triggerDate.setSeconds(triggerDate.getSeconds() + delayAmount);
    break;
  case 'minutes':
    triggerDate.setMinutes(triggerDate.getMinutes() + delayAmount);
    break;
  case 'hours':
    triggerDate.setHours(triggerDate.getHours() + delayAmount);
    break;
  case 'days':
    triggerDate.setDate(triggerDate.getDate() + delayAmount);
    break;
  case 'weeks':
    triggerDate.setDate(triggerDate.getDate() + (delayAmount * 7));
    break;
}
```

---

## Time Frame Handling

### Three Handling Modes

#### 1. RESPECT_TIMEFRAME
- Only assign quizzes when users are within their active time frame
- Checks current hour against user's start/end hours
- Handles overnight time frames (e.g., 22:00 to 06:00)

```javascript
if (quiz.timeFrameHandling === 'RESPECT_TIMEFRAME') {
  if (user.timeFrame && user.timeFrame.active) {
    const currentHour = now.getHours();
    const startHour = user.timeFrame.start.getHours();
    const endHour = user.timeFrame.end.getHours();
    
    const isInTimeFrame = (startHour <= endHour) 
      ? (currentHour >= startHour && currentHour <= endHour)
      : (currentHour >= startHour || currentHour <= endHour);
    
    if (!isInTimeFrame) {
      shouldAssign = false;
    }
  }
}
```

#### 2. ALL_USERS
- Assign quizzes regardless of user time frame settings
- Ignore time frame restrictions completely
- Suitable for urgent or important quizzes

```javascript
if (quiz.timeFrameHandling === 'ALL_USERS') {
  // Always assign regardless of time frame
  shouldAssign = true;
}
```

#### 3. OUTSIDE_TIMEFRAME_ONLY
- Only assign quizzes when users are OUTSIDE their time frame
- Useful for maintenance notifications or off-hours content
- Inverts the time frame logic

```javascript
if (quiz.timeFrameHandling === 'OUTSIDE_TIMEFRAME_ONLY') {
  if (user.timeFrame && user.timeFrame.active) {
    const currentHour = now.getHours();
    const startHour = user.timeFrame.start.getHours();
    const endHour = user.timeFrame.end.getHours();
    
    const isInTimeFrame = (startHour <= endHour) 
      ? (currentHour >= startHour && currentHour <= endHour)
      : (currentHour >= startHour || currentHour <= endHour);
    
    if (isInTimeFrame) {
      shouldAssign = false; // Don't assign if IN time frame
    }
  }
}
```

---

## Code Examples

### Example 1: Creating a Quick Response Quiz (5 seconds)

```javascript
const urgentQuiz = new Quiz({
  name: 'Urgent Feedback Quiz',
  triggerType: 'TIME_INTERVAL',
  triggerDelayAmount: 5,
  triggerDelayUnit: 'seconds',
  triggerStartFrom: 'REGISTRATION',
  timeFrameHandling: 'ALL_USERS',
  isActive: true,
  questions: [
    {
      questionText: 'How was your onboarding experience?',
      type: 'multiple-choice',
      options: [
        { text: 'Excellent' },
        { text: 'Good' },
        { text: 'Needs improvement' }
      ]
    }
  ]
});
```

### Example 2: Weekly Check-in Quiz

```javascript
const weeklyQuiz = new Quiz({
  name: 'Weekly Progress Check',
  triggerType: 'TIME_INTERVAL',
  triggerDelayAmount: 1,
  triggerDelayUnit: 'weeks',
  triggerStartFrom: 'LAST_QUIZ',
  timeFrameHandling: 'RESPECT_TIMEFRAME',
  isActive: true,
  questions: [
    {
      questionText: 'How has your week been?',
      type: 'multiple-choice',
      options: [
        { text: 'Great progress' },
        { text: 'Some challenges' },
        { text: 'Need support' }
      ]
    }
  ]
});
```

### Example 3: Testing Auto-Assignment

```javascript
// Test script to verify auto-assignment functionality
import { autoAssignQuizzes } from './controllers/quizController.js';
import connectDB from './config/db.js';

const testAutoAssignment = async () => {
  await connectDB();
  
  console.log('Testing auto-assignment...');
  const result = await autoAssignQuizzes();
  
  console.log(`Assigned ${result.assignedCount} quizzes`);
};

testAutoAssignment();
```

---

## Testing Guide

### Unit Tests

#### Test Reference Date Calculation
```javascript
describe('Reference Date Calculation', () => {
  it('should use registration date for REGISTRATION trigger', () => {
    const user = { createdAt: new Date('2025-01-01') };
    const quiz = { triggerStartFrom: 'REGISTRATION' };
    
    const referenceDate = calculateReferenceDate(user, quiz);
    expect(referenceDate).toEqual(user.createdAt);
  });
  
  it('should use first quiz date for FIRST_QUIZ trigger', () => {
    const user = {
      createdAt: new Date('2025-01-01'),
      quizResults: [
        { completedAt: new Date('2025-01-05') },
        { completedAt: new Date('2025-01-03') }
      ]
    };
    const quiz = { triggerStartFrom: 'FIRST_QUIZ' };
    
    const referenceDate = calculateReferenceDate(user, quiz);
    expect(referenceDate).toEqual(new Date('2025-01-03'));
  });
});
```

#### Test Time Unit Calculation
```javascript
describe('Trigger Date Calculation', () => {
  it('should correctly add seconds', () => {
    const referenceDate = new Date('2025-01-01T12:00:00Z');
    const quiz = { triggerDelayAmount: 30, triggerDelayUnit: 'seconds' };
    
    const triggerDate = calculateTriggerDate(referenceDate, quiz);
    expect(triggerDate).toEqual(new Date('2025-01-01T12:00:30Z'));
  });
  
  it('should correctly add weeks', () => {
    const referenceDate = new Date('2025-01-01');
    const quiz = { triggerDelayAmount: 2, triggerDelayUnit: 'weeks' };
    
    const triggerDate = calculateTriggerDate(referenceDate, quiz);
    expect(triggerDate).toEqual(new Date('2025-01-15'));
  });
});
```

### Integration Tests

#### Test Auto-Assignment End-to-End
```javascript
describe('Auto-Assignment Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });
  
  it('should assign quiz after delay period', async () => {
    // Create user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(Date.now() - 60000) // 1 minute ago
    });
    
    // Create quiz with 30-second delay
    const quiz = await Quiz.create({
      name: 'Test Quiz',
      triggerType: 'TIME_INTERVAL',
      triggerDelayAmount: 30,
      triggerDelayUnit: 'seconds',
      triggerStartFrom: 'REGISTRATION',
      timeFrameHandling: 'ALL_USERS',
      isActive: true
    });
    
    // Run auto-assignment
    const result = await autoAssignQuizzes();
    
    // Verify quiz was assigned
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.pendingQuizzes).toHaveLength(1);
    expect(updatedUser.pendingQuizzes[0].quizId.toString()).toBe(quiz._id.toString());
  });
});
```

### Manual Testing Scenarios

#### Scenario 1: Immediate Assignment (5 seconds)
1. Create quiz with 5-second delay from registration
2. Register new user
3. Wait 6 seconds
4. Run auto-assignment
5. Verify quiz appears in user's pending list

#### Scenario 2: Weekly Follow-up
1. Create quiz with 1-week delay from last quiz
2. User completes initial quiz
3. Wait 1 week (or adjust system time)
4. Run auto-assignment
5. Verify follow-up quiz is assigned

#### Scenario 3: Time Frame Respect
1. Set user time frame: 9 AM - 5 PM
2. Create quiz with RESPECT_TIMEFRAME
3. Run auto-assignment at 11 AM (should assign)
4. Run auto-assignment at 8 PM (should not assign)

---

## Migration Guide

### Upgrading from Legacy System

#### Step 1: Database Migration
```javascript
// Migration script to add new fields to existing quizzes
const migrateQuizzes = async () => {
  const quizzes = await Quiz.find({});
  
  for (const quiz of quizzes) {
    // Set default values for new fields
    quiz.triggerDelayAmount = quiz.triggerDelayDays || 0;
    quiz.triggerDelayUnit = 'days';
    quiz.triggerStartFrom = 'REGISTRATION';
    quiz.timeFrameHandling = quiz.respectUserTimeFrame 
      ? 'RESPECT_TIMEFRAME' 
      : 'ALL_USERS';
    
    await quiz.save();
  }
  
  console.log(`Migrated ${quizzes.length} quizzes`);
};
```

#### Step 2: Update Frontend Code
1. Add new form controls for enhanced scheduling
2. Update state management for new fields
3. Include new fields in API calls
4. Test form submission and loading

#### Step 3: Update Auto-Assignment Logic
1. Modify existing auto-assignment to use new fields
2. Maintain backward compatibility with legacy fields
3. Test all trigger scenarios
4. Monitor assignment logs

### Backward Compatibility

The system maintains full backward compatibility:
- Legacy `triggerDelayDays` field still works
- Old `respectUserTimeFrame` boolean honored
- Existing quizzes continue functioning
- No data loss during migration

---

## Troubleshooting

### Common Issues

#### Quiz Not Being Assigned
1. **Check Quiz Status**: Ensure `isActive: true`
2. **Verify Trigger Type**: Must be `'TIME_INTERVAL'`
3. **Check Timing**: Verify trigger date calculation
4. **Time Frame Issues**: Check user time frame settings
5. **Duplicate Assignment**: Quiz might already be assigned/completed

```javascript
// Debug script to check quiz assignment eligibility
const debugQuizAssignment = async (userId, quizId) => {
  const user = await User.findById(userId);
  const quiz = await Quiz.findById(quizId);
  
  console.log('User:', user.email);
  console.log('Quiz:', quiz.name);
  console.log('Quiz Active:', quiz.isActive);
  console.log('Trigger Type:', quiz.triggerType);
  
  // Check if already assigned
  const alreadyAssigned = user.pendingQuizzes.some(
    p => p.quizId.toString() === quizId
  );
  console.log('Already Assigned:', alreadyAssigned);
  
  // Check if already completed
  const alreadyCompleted = user.quizResults.some(
    r => r.quizId.toString() === quizId
  );
  console.log('Already Completed:', alreadyCompleted);
  
  // Calculate trigger date
  const referenceDate = calculateReferenceDate(user, quiz);
  const triggerDate = calculateTriggerDate(referenceDate, quiz);
  const now = new Date();
  
  console.log('Reference Date:', referenceDate);
  console.log('Trigger Date:', triggerDate);
  console.log('Current Date:', now);
  console.log('Should Trigger:', now >= triggerDate);
};
```

#### Time Frame Logic Issues
1. **Timezone Problems**: Ensure consistent timezone handling
2. **Overnight Ranges**: Test time frames that cross midnight
3. **Inactive Time Frames**: Check `timeFrame.active` flag

#### Performance Issues
1. **Large User Base**: Consider pagination for auto-assignment
2. **Frequent Assignments**: Implement rate limiting
3. **Database Queries**: Add indexes for quiz/user lookups

### Debugging Tools

#### Assignment Log Analysis
```javascript
// Enhanced logging for auto-assignment debugging
const debugAutoAssignment = async () => {
  console.log('=== AUTO-ASSIGNMENT DEBUG SESSION ===');
  
  const quizzes = await Quiz.find({ triggerType: 'TIME_INTERVAL', isActive: true });
  console.log(`Found ${quizzes.length} active time-based quizzes`);
  
  for (const quiz of quizzes) {
    console.log(`\n--- Quiz: ${quiz.name} ---`);
    console.log(`Delay: ${quiz.triggerDelayAmount} ${quiz.triggerDelayUnit}`);
    console.log(`Start From: ${quiz.triggerStartFrom}`);
    console.log(`Time Frame Handling: ${quiz.timeFrameHandling}`);
    
    const eligibleUsers = await findEligibleUsers(quiz);
    console.log(`Eligible Users: ${eligibleUsers.length}`);
  }
};
```

#### User State Inspection
```javascript
// Check user's quiz state
const inspectUserQuizState = async (userId) => {
  const user = await User.findById(userId).populate('pendingQuizzes.quizId');
  
  console.log(`User: ${user.email}`);
  console.log(`Pending Quizzes: ${user.pendingQuizzes.length}`);
  console.log(`Completed Quizzes: ${user.quizResults.length}`);
  console.log(`Time Frame Active: ${user.timeFrame?.active}`);
  
  if (user.timeFrame?.active) {
    console.log(`Time Frame: ${user.timeFrame.start} - ${user.timeFrame.end}`);
  }
  
  user.pendingQuizzes.forEach(pq => {
    console.log(`- Pending: ${pq.quizId.name} (assigned: ${pq.assignedAt})`);
  });
};
```

---

## Performance Optimization

### Database Indexes
```javascript
// Recommended indexes for optimal performance
db.quizzes.createIndex({ "triggerType": 1, "isActive": 1 });
db.users.createIndex({ "isAdmin": 1 });
db.users.createIndex({ "pendingQuizzes.quizId": 1 });
db.users.createIndex({ "quizResults.quizId": 1 });
db.users.createIndex({ "createdAt": 1 });
```

### Batch Processing
```javascript
// Process users in batches for large-scale assignment
const batchAutoAssignment = async (batchSize = 100) => {
  const quizzes = await Quiz.find({ triggerType: 'TIME_INTERVAL', isActive: true });
  let skip = 0;
  let totalAssigned = 0;
  
  while (true) {
    const users = await User.find({ isAdmin: false })
      .skip(skip)
      .limit(batchSize);
    
    if (users.length === 0) break;
    
    for (const user of users) {
      for (const quiz of quizzes) {
        const assigned = await processQuizAssignment(user, quiz);
        if (assigned) totalAssigned++;
      }
    }
    
    skip += batchSize;
    console.log(`Processed ${skip} users...`);
  }
  
  return totalAssigned;
};
```

---

## Security Considerations

### Access Control
- Only admin users can create/modify quiz schedules
- Auto-assignment requires admin privileges
- User quiz access validated through authentication

### Data Validation
```javascript
// Input validation for quiz scheduling
const validateQuizScheduling = (quizData) => {
  const errors = [];
  
  if (quizData.triggerDelayAmount < 0) {
    errors.push('Delay amount must be non-negative');
  }
  
  if (quizData.triggerDelayAmount > 999999) {
    errors.push('Delay amount too large');
  }
  
  const validUnits = ['seconds', 'minutes', 'hours', 'days', 'weeks'];
  if (!validUnits.includes(quizData.triggerDelayUnit)) {
    errors.push('Invalid time unit');
  }
  
  const validStartFrom = ['REGISTRATION', 'FIRST_QUIZ', 'LAST_QUIZ'];
  if (!validStartFrom.includes(quizData.triggerStartFrom)) {
    errors.push('Invalid trigger start point');
  }
  
  const validTimeFrameHandling = ['RESPECT_TIMEFRAME', 'ALL_USERS', 'OUTSIDE_TIMEFRAME_ONLY'];
  if (!validTimeFrameHandling.includes(quizData.timeFrameHandling)) {
    errors.push('Invalid time frame handling');
  }
  
  return errors;
};
```

---

## Future Enhancements

### Planned Features
1. **Conditional Assignments**: Assign based on user responses
2. **Advanced Scheduling**: Specific days/times for assignment
3. **Quiz Chains**: Sequential quiz series with dependencies
4. **Analytics Dashboard**: Assignment success rates and timing analytics
5. **A/B Testing**: Compare different scheduling strategies

### Extensibility Points
- Custom reference date calculations
- Additional time frame handling modes
- Integration with external scheduling services
- Advanced user segmentation for assignments

---

## Conclusion

The Enhanced Quiz Scheduling System provides a comprehensive, flexible solution for intelligent quiz assignment. With support for timing from 5 seconds to multiple weeks, multiple reference points, and advanced time frame handling, it meets complex scheduling requirements while maintaining simplicity and backward compatibility.

Key benefits:
- **Flexibility**: Wide range of timing options
- **Intelligence**: Context-aware assignment logic
- **Usability**: Intuitive admin interface
- **Scalability**: Efficient batch processing
- **Reliability**: Comprehensive error handling and testing

For additional support or feature requests, please refer to the project repository or contact the development team.

---

*This documentation covers the complete Enhanced Quiz Scheduling System implementation as of July 2025.*
