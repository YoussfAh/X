import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Quiz from '../models/quizModel.js';
import User from '../models/userModel.js';
import Collection from '../models/collectionModel.js';

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Admin
const createQuiz = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // A name is required to create a new quiz
  if (!name) {
    res.status(400);
    throw new Error('Quiz name is required');
  }

  const quizExists = await Quiz.findOne({ name });
  if (quizExists) {
    res.status(400);
    throw new Error('A quiz with this name already exists');
  }

  const quiz = new Quiz({
    name: name,
    questions: [], // Start with an empty quiz
    assignmentRules: [],
  });

  const createdQuiz = await quiz.save();
  res.status(201).json(createdQuiz);
});

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Admin
const getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({});
  res.json(quizzes);
});

// @desc    Get a single quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public (for taking a quiz) / Admin (for editing)
const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate(
    'questions.options.assignCollection assignmentRules.assignCollection'
  );

  if (quiz) {
    res.json(quiz);
  } else {
    res.status(404);
    throw new Error('Quiz not found');
  }
});

// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Admin
const updateQuiz = asyncHandler(async (req, res) => {
  const { id: quizId } = req.params;
  const data = req.body;

  console.log('--- QUIZ UPDATE REQUEST ---');
  console.log('Quiz ID:', quizId);
  console.log('Request data:', JSON.stringify(data, null, 2));

  // 1. Find the existing quiz
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    res.status(404);
    throw new Error('Quiz not found');
  }

  // 2. Process questions and options, handling temporary IDs
  const idMap = new Map();
  const processedQuestions = (data.questions || []).map((q) => {
    const questionId =
      q._id && q._id.startsWith('temp_')
        ? new mongoose.Types.ObjectId()
        : q._id;
    if (q._id && q._id.startsWith('temp_')) {
      idMap.set(q._id, questionId);
    }
    const processedOptions = (q.options || []).map((o) => {
      const optionId =
        o._id && o._id.startsWith('temp_')
          ? new mongoose.Types.ObjectId()
          : o._id;
      if (o._id && o._id.startsWith('temp_')) {
        idMap.set(o._id, optionId);
      }
      return {
        _id: optionId,
        text: o.text,
        assignCollection: o.assignCollection || null, // Explicitly carry over the value
      };
    });
    return {
      ...q,
      _id: questionId,
      options: processedOptions,
    };
  });

  // 3. Process assignment rules, handling temporary IDs and ensuring option ID consistency
  const processedRules = (data.assignmentRules || []).map((r) => {
    const ruleId =
      r._id && r._id.startsWith('temp_')
        ? new mongoose.Types.ObjectId()
        : r._id;
    const processedConditions = (r.conditions || []).map((c) => {
      let finalQuestionId = idMap.get(c.questionId) || c.questionId;
      let finalOptionId = idMap.get(c.optionId) || c.optionId;

      // If optionId is not in idMap, try to find it in the processed questions
      if (!idMap.has(c.optionId)) {
        const matchingQuestion = processedQuestions.find(
          (q) =>
            q._id &&
            finalQuestionId &&
            q._id.toString() === finalQuestionId.toString()
        );
        if (matchingQuestion && c.optionId) {
          const matchingOption = matchingQuestion.options.find(
            (opt) => opt._id && opt._id.toString() === c.optionId.toString()
          );
          if (matchingOption) {
            finalOptionId = matchingOption._id;
            console.log(
              `[ASSIGNMENT RULES] Found option ${c.optionId} in processed questions, using ID: ${finalOptionId}`
            );
          } else {
            console.warn(
              `[ASSIGNMENT RULES] Option ${c.optionId} not found in question ${finalQuestionId}. Available options:`,
              matchingQuestion.options.map((opt) =>
                opt._id ? opt._id.toString() : 'undefined'
              )
            );
          }
        }
      }

      return {
        questionId: finalQuestionId,
        optionId: finalOptionId,
      };
    });
    return {
      ...r,
      _id: ruleId,
      conditions: processedConditions,
      assignCollection: r.assignCollection || null,
    };
  });

  // 4. Update the quiz object with the new, processed data
  quiz.name = data.name ?? quiz.name;
  quiz.questions = processedQuestions;
  quiz.assignmentRules = processedRules;
  quiz.backgroundUrl = data.backgroundUrl ?? quiz.backgroundUrl;
  quiz.isActive = data.isActive ?? quiz.isActive;
  quiz.assignmentDelaySeconds =
    data.assignmentDelaySeconds ?? quiz.assignmentDelaySeconds;
  quiz.triggerType = data.triggerType ?? quiz.triggerType;
  quiz.triggerDelayDays = data.triggerDelayDays ?? quiz.triggerDelayDays;

  // Enhanced scheduling fields
  quiz.triggerDelayAmount = data.triggerDelayAmount ?? quiz.triggerDelayAmount;
  quiz.triggerDelayUnit = data.triggerDelayUnit ?? quiz.triggerDelayUnit;
  quiz.triggerStartFrom = data.triggerStartFrom ?? quiz.triggerStartFrom;
  quiz.timeFrameHandling = data.timeFrameHandling ?? quiz.timeFrameHandling;

  quiz.respectUserTimeFrame =
    data.respectUserTimeFrame ?? quiz.respectUserTimeFrame;
  quiz.homePageMessage = data.homePageMessage ?? quiz.homePageMessage;
  quiz.completionMessage = data.completionMessage ?? quiz.completionMessage;

  // 5. Mark nested arrays as modified and save
  quiz.markModified('questions');
  quiz.markModified('assignmentRules');

  console.log('--- SAVING QUIZ ---');
  console.log(
    'Assignment rules being saved:',
    JSON.stringify(quiz.assignmentRules, null, 2)
  );
  console.log('Enhanced scheduling fields being saved:');
  console.log('- triggerDelayAmount:', quiz.triggerDelayAmount);
  console.log('- triggerDelayUnit:', quiz.triggerDelayUnit);
  console.log('- triggerStartFrom:', quiz.triggerStartFrom);
  console.log('- timeFrameHandling:', quiz.timeFrameHandling);

  const updatedQuiz = await quiz.save();

  console.log('--- QUIZ SAVED SUCCESSFULLY ---');
  console.log('Updated quiz ID:', updatedQuiz._id);
  console.log(
    'Assignment rules in saved quiz:',
    JSON.stringify(updatedQuiz.assignmentRules, null, 2)
  );

  // 6. Respond with the fully populated, updated quiz
  const populatedQuiz = await Quiz.findById(updatedQuiz._id).populate(
    'questions.options.assignCollection assignmentRules.assignCollection'
  );

  console.log('--- RETURNING POPULATED QUIZ ---');
  console.log(
    'Assignment rules in populated quiz:',
    JSON.stringify(populatedQuiz.assignmentRules, null, 2)
  );

  res.json(populatedQuiz);
});

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Admin
const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (quiz) {
    await quiz.deleteOne();
    res.json({ message: 'Quiz removed' });
  } else {
    res.status(404);
    throw new Error('Quiz not found');
  }
});

// @desc    Submit answers for a specific quiz
// @route   POST /api/quizzes/:id/submit
// @access  Private
const submitQuizAnswers = asyncHandler(async (req, res) => {
  const { answers, quizId } = req.body; // Expects [{ questionId, optionId }] and quizId
  const userId = req.user._id;

  console.log(`--- Quiz Submission ---`);
  console.log(`User: ${req.user.email} | Quiz ID: ${quizId}`);
  console.log(`Received answers:`, JSON.stringify(answers, null, 2));

  const user = await User.findById(userId);
  const quiz = await Quiz.findById(quizId).populate(
    'assignmentRules.assignCollection'
  );

  if (!user || !quiz) {
    res.status(404);
    throw new Error('User or Quiz not found');
  }

  // --- Process Answers and Determine Collections to Assign ---
  const collectionsToAssign = new Map();
  const answerMap = new Map(
    answers.map((a) => [a.questionId, a.optionId || a.textAnswer])
  );

  // 1. Check direct assignments from selected options (only for multiple choice/true-false)
  for (const question of quiz.questions) {
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const selectedOptionId = answerMap.get(question._id.toString());
      if (selectedOptionId) {
        const selectedOption = question.options.find(
          (o) => o._id.toString() === selectedOptionId
        );
        if (selectedOption && selectedOption.assignCollection) {
          const coll = await Collection.findById(
            selectedOption.assignCollection
          );
          if (coll && !collectionsToAssign.has(coll._id.toString())) {
            console.log(
              `Assigning collection '${coll.name}' from direct answer.`
            );
            collectionsToAssign.set(coll._id.toString(), coll);
          }
        }
      }
    }
  }

  // 2. Check assignment rules (only for multiple choice/true-false)
  for (const rule of quiz.assignmentRules) {
    const allConditionsMet = rule.conditions.every((condition) => {
      const questionAnswer = answerMap.get(condition.questionId.toString());
      return questionAnswer === condition.optionId.toString();
    });
    if (allConditionsMet && rule.assignCollection) {
      const coll = rule.assignCollection; // Already populated
      if (coll && !collectionsToAssign.has(coll._id.toString())) {
        console.log(`Assigning collection '${coll.name}' from rule.`);
        collectionsToAssign.set(coll._id.toString(), coll);
      }
    }
  }

  console.log(`Total collections to assign: ${collectionsToAssign.size}`);

  // --- Record Quiz Result ---
  const resultAnswers = answers.map((answer) => {
    const question = quiz.questions.find(
      (q) => q._id.toString() === answer.questionId
    );

    // Handle text questions
    if (answer.textAnswer !== undefined) {
      return {
        question: question ? question.questionText : 'N/A',
        answer: answer.textAnswer,
        questionType: question ? question.type : 'text',
      };
    }

    // Handle multiple choice / true-false questions
    const option = question
      ? question.options.find((o) => o._id.toString() === answer.optionId)
      : null;
    return {
      question: question ? question.questionText : 'N/A',
      answer: option ? option.text : 'N/A',
      questionType: question ? question.type : 'multiple-choice',
    };
  });

  user.quizResults.push({
    quizId,
    quizName: quiz.name,
    answers: resultAnswers,
    submittedAt: new Date(),
    assignedCollections: Array.from(collectionsToAssign.values()).map(
      (collection) => ({
        collectionId: collection._id,
        collectionName: collection.name,
        assignedAt: new Date(),
      })
    ),
  });

  // --- Update User State ---
  user.pendingQuizzes = user.pendingQuizzes.filter(
    (pending) => pending.quizId.toString() !== quizId
  );

  await user.save();
  console.log(
    `User '${user.email}' state updated. Pending quiz removed, results saved.`
  );

  // --- Execute Delayed Assignment ---
  const delaySeconds = quiz.assignmentDelaySeconds || 0;

  // Capture collections to assign in closure-safe way
  const collectionsArray = Array.from(collectionsToAssign.values());
  console.log(
    `PREPARING DELAYED ASSIGNMENT: ${collectionsArray.length} collections to assign in ${delaySeconds} seconds`
  );

  if (delaySeconds > 0) {
    console.log(
      `QUIZ ASSIGNMENT DELAY: Will assign collections in ${delaySeconds} seconds at ${new Date(
        Date.now() + delaySeconds * 1000
      ).toISOString()}`
    );
  } else {
    console.log(`QUIZ ASSIGNMENT: Immediate assignment (no delay)`);
  }

  const assignCollectionsToUser = async () => {
    try {
      const userToUpdate = await User.findById(userId);
      if (!userToUpdate) {
        console.log(`DELAYED ASSIGNMENT FAILED: User ${userId} not found`);
        return;
      }

      // Ensure assignedCollections array exists
      if (!userToUpdate.assignedCollections) {
        userToUpdate.assignedCollections = [];
      }

      let assignedCount = 0;
      for (const collection of collectionsArray) {
        const isAlreadyAssigned = userToUpdate.assignedCollections.some(
          (c) => c.collectionId.toString() === collection._id.toString()
        );
        if (!isAlreadyAssigned) {
          userToUpdate.assignedCollections.push({
            collectionId: collection._id,
            name: collection.name,
            description: collection.description || '',
            image: collection.image || '/images/sample.jpg',
            displayOrder: collection.displayOrder || 0,
            isPublic: collection.isPublic || false,
            assignedAt: new Date(),
            assignedBy: userId, // User assigned via quiz
            status: 'active',
            notes: `Assigned via quiz: ${quiz.name}`,
            tags: ['quiz-assignment'],
          });
          assignedCount++;
          console.log(
            `DELAYED ASSIGNMENT: '${collection.name}' assigned to user '${userToUpdate.email}'`
          );
        } else {
          console.log(
            `DELAYED ASSIGNMENT SKIPPED: '${collection.name}' already assigned to user '${userToUpdate.email}'`
          );
        }
      }

      if (assignedCount > 0) {
        await userToUpdate.save();
        console.log(
          `DELAYED ASSIGNMENT COMPLETE: ${assignedCount} collections assigned to '${userToUpdate.email}' from quiz '${quiz.name}'.`
        );
      } else {
        console.log(
          `DELAYED ASSIGNMENT: No new collections to assign to '${userToUpdate.email}'.`
        );
      }
    } catch (error) {
      console.error('DELAYED QUIZ ASSIGNMENT FAILED:', error);
    }
  };

  if (delaySeconds > 0) {
    setTimeout(assignCollectionsToUser, delaySeconds * 1000);
  } else {
    await assignCollectionsToUser();
  }

  res.status(200).json({
    message: 'Quiz answers submitted successfully.',
    delaySeconds,
    completionMessage:
      quiz.completionMessage ||
      'Thank you for completing the quiz! Your responses have been saved and your profile is being updated.',
  });
});

// @desc    Get a user's quiz results
// @route   GET /api/quizzes/results/:userId
// @access  Admin
const getQuizResultsForUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).populate({
    path: 'quizResults',
    populate: [
      { path: 'quizId', select: 'name' },
      { path: 'assignedCollections.collectionId', select: 'name' },
    ],
  });

  if (user) {
    const sortedResults = user.quizResults.sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    res.json(sortedResults);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get the active quiz for the logged-in user
// @route   GET /api/quizzes/active-for-user
// @access  Private
const getActiveQuizForUser = asyncHandler(async (req, res) => {
  console.log(`--- Getting Active Quiz for User: ${req.user.email} ---`);
  const user = await User.findById(req.user._id).populate({
    path: 'pendingQuizzes.quizId',
    model: 'Quiz',
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // --- Data Integrity Check & Cleanup ---
  // Filter out pending quizzes where the quiz document no longer exists.
  const originalPendingCount = user.pendingQuizzes.length;
  const validPendingQuizzes = user.pendingQuizzes.filter((pending) => {
    if (pending.quizId) {
      return true; // Keep it, the quiz exists.
    }
    console.warn(
      `Data Integrity Warning: User '${user.email}' has a pending quiz reference to a non-existent quiz. This reference will be removed.`
    );
    return false; // Discard it.
  });

  // If any orphaned references were found and removed, save the user document.
  if (validPendingQuizzes.length < originalPendingCount) {
    user.pendingQuizzes = validPendingQuizzes;
    await user.save();
    console.log(
      `Cleaned ${
        originalPendingCount - validPendingQuizzes.length
      } orphaned pending quiz references for user '${user.email}'.`
    );
  }

  if (validPendingQuizzes.length === 0) {
    console.log('No valid pending quizzes found. Returning null.');
    return res.json(null);
  }

  // --- Find Eligible Quiz ---
  const now = new Date();
  let eligibleQuiz = null;

  const sortedPendingQuizzes = validPendingQuizzes.sort(
    (a, b) => new Date(a.assignedAt) - new Date(b.assignedAt)
  );

  for (const pendingQuiz of sortedPendingQuizzes) {
    const quiz = pendingQuiz.quizId;
    console.log(`\n--- Evaluating quiz: "${quiz.name}" (ID: ${quiz._id}) ---`);

    // MODIFIED: Show ALL assigned quizzes regardless of active status or question count
    console.log(
      `Quiz "${quiz.name}" - Active: ${quiz.isActive}, Questions: ${
        quiz.questions?.length || 0
      }`
    );

    // Skip only if quiz document is corrupted/invalid, not based on activity status
    if (!quiz.name) {
      console.log(`Quiz data appears corrupted (no name). Skipping.`);
      continue;
    }

    if (quiz.triggerType === 'TIME_INTERVAL') {
      console.log(`Checking TIME_INTERVAL trigger...`);

      // Calculate the reference date based on triggerStartFrom
      let referenceDate;
      switch (quiz.triggerStartFrom) {
        case 'FIRST_QUIZ':
          // Find the earliest quiz result from user's quiz results
          if (user.quizResults && user.quizResults.length > 0) {
            const sortedResults = user.quizResults.sort(
              (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
            );
            referenceDate = new Date(sortedResults[0].submittedAt);
          } else {
            console.log(
              'No first quiz found, using registration date as fallback.'
            );
            referenceDate = new Date(user.createdAt);
          }
          break;
        case 'LAST_QUIZ':
          // Find the latest quiz result from user's quiz results
          if (user.quizResults && user.quizResults.length > 0) {
            const sortedResults = user.quizResults.sort(
              (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
            );
            referenceDate = new Date(sortedResults[0].submittedAt);
          } else {
            console.log(
              'No last quiz found, using registration date as fallback.'
            );
            referenceDate = new Date(user.createdAt);
          }
          break;
        case 'REGISTRATION':
        default:
          referenceDate = new Date(user.createdAt);
          break;
      }

      console.log(
        `Reference date (${quiz.triggerStartFrom}): ${referenceDate}`
      );

      // Calculate delay amount in milliseconds
      let delayMs = 0;
      const amount = quiz.triggerDelayAmount || quiz.triggerDelayDays || 0;
      const unit = quiz.triggerDelayUnit || 'days';

      if (amount > 0) {
        switch (unit) {
          case 'seconds':
            delayMs = amount * 1000;
            break;
          case 'minutes':
            delayMs = amount * 60 * 1000;
            break;
          case 'hours':
            delayMs = amount * 60 * 60 * 1000;
            break;
          case 'days':
            delayMs = amount * 24 * 60 * 60 * 1000;
            break;
          case 'weeks':
            delayMs = amount * 7 * 24 * 60 * 60 * 1000;
            break;
          default:
            delayMs = amount * 24 * 60 * 60 * 1000; // Default to days
            break;
        }

        const triggerDate = new Date(referenceDate.getTime() + delayMs);
        console.log(
          `Delay: ${amount} ${unit}, Trigger date: ${triggerDate}, Now: ${now}`
        );

        if (now < triggerDate) {
          console.log('Trigger date has not been reached. Skipping.');
          continue;
        }
        console.log('Trigger date has been reached.');
      } else {
        console.log('No delay specified, immediate trigger.');
      }
    } else {
      console.log(
        `Quiz trigger type is "${quiz.triggerType}". No time interval delay to check.`
      );
    }

    // Handle time frame based on the new timeFrameHandling field
    const timeFrameHandling = quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';
    console.log(`Time frame handling: ${timeFrameHandling}`);

    // MODIFIED: Allow ALL_USERS by default for admin-assigned quizzes to show immediately
    switch (timeFrameHandling) {
      case 'RESPECT_TIMEFRAME':
        if (!user.timeFrame.isWithinTimeFrame) {
          console.log(
            'User is outside their allowed time frame, but showing quiz anyway for admin visibility.'
          );
          // Continue instead of skip - show the quiz but note the timeframe issue
        } else {
          console.log('User is within their allowed time frame.');
        }
        break;
      case 'ALL_USERS':
        console.log('Quiz allows all users regardless of time frame.');
        break;
      case 'OUTSIDE_TIMEFRAME_ONLY':
        if (user.timeFrame.isWithinTimeFrame) {
          console.log(
            'User is within time frame, but quiz is only for users outside time frame. Showing quiz anyway for admin visibility.'
          );
          // Continue instead of skip - show the quiz but note the timeframe issue
        } else {
          console.log(
            'User is outside time frame, which matches quiz requirement.'
          );
        }
        break;
      default:
        // Fallback to legacy respectUserTimeFrame for backward compatibility
        if (quiz.respectUserTimeFrame) {
          console.log('Using legacy respectUserTimeFrame setting. Checking...');
          if (!user.timeFrame.isWithinTimeFrame) {
            console.log(
              'User is outside their allowed time frame, but showing quiz anyway for admin visibility.'
            );
            // Continue instead of skip - show the quiz but note the timeframe issue
          } else {
            console.log('User is within their allowed time frame.');
          }
        } else {
          console.log('Legacy setting: Quiz does not respect user time frame.');
        }
        break;
    }

    console.log(`*** Found eligible quiz: "${quiz.name}" ***`);
    eligibleQuiz = quiz;
    break;
  }

  if (!eligibleQuiz) {
    console.log(
      '--- No eligible quiz found after checking all pending quizzes. ---'
    );
  }

  res.json(eligibleQuiz);
});

// @desc    Assign a quiz to a user by an admin
// @route   POST /api/quizzes/assign/:userId/:quizId
// @access  Admin
const assignQuizToUser = asyncHandler(async (req, res) => {
  // Defensive check to ensure admin user is on the request object
  if (!req.user || !req.user._id) {
    console.error(
      'CRITICAL AUTH ERROR: assignQuizToUser was called without a valid admin user on the request. Check auth middleware.'
    );
    res.status(500);
    throw new Error(
      'Server error: Could not identify the admin user making the request.'
    );
  }
  try {
    const { userId, quizId } = req.params;
    console.log(
      `[QUIZ ASSIGNMENT] Admin ${req.user.email} is assigning quiz ${quizId} to user ${userId}`
    );

    const user = await User.findById(userId);
    const quiz = await Quiz.findById(quizId);

    if (!user || !quiz) {
      console.log(
        `[QUIZ ASSIGNMENT ERROR] User or Quiz not found. User: ${!!user}, Quiz: ${!!quiz}`
      );
      res.status(404);
      throw new Error('User or Quiz not found');
    }

    // Check if this quiz is already assigned to avoid duplicates
    const existingAssignment = user.pendingQuizzes.find(
      (pendingQuiz) => pendingQuiz.quizId.toString() === quizId
    );

    if (existingAssignment) {
      console.log(
        `[QUIZ ASSIGNMENT] Quiz ${quizId} already assigned to user ${userId}`
      );
      return res
        .status(400)
        .json({ message: 'This quiz is already assigned to the user' });
    }

    // Add the new quiz assignment
    user.pendingQuizzes.push({
      quizId,
      assignedAt: new Date(),
      assignedBy: req.user._id,
      assignmentType: 'ADMIN_MANUAL',
      scheduledFor: new Date(), // Immediately available for admin assignments
      isAvailable: true,
      isAvailable: true,
    });

    await user.save();
    console.log(
      `[QUIZ ASSIGNMENT SUCCESS] Quiz ${quiz.name} assigned to user ${user.email}`
    );

    res.status(200).json({ message: 'Quiz assigned successfully' });
  } catch (error) {
    console.error(
      `[CRITICAL] Failed to assign quiz. User: ${req.params.userId}, Quiz: ${req.params.quizId}. Error: ${error.message}`
    );
    res.status(500);
    throw new Error(`Server error: Could not assign quiz. ${error.message}`);
  }
});

// @desc    Un-assign a quiz from a user by an admin
// @route   DELETE /api/quizzes/unassign/:userId/:quizId?
// @access  Admin
const unassignQuizFromUser = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    console.error(
      'CRITICAL AUTH ERROR: unassignQuizFromUser was called without a valid admin user on the request. Check auth middleware.'
    );
    res.status(500);
    throw new Error(
      'Server error: Could not identify the admin user making the request.'
    );
  }

  try {
    const { userId, quizId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.pendingQuizzes.length === 0) {
      return res
        .status(200)
        .json({ message: 'User has no pending quizzes to un-assign.' });
    }

    // If specific quizId is provided, remove only that quiz
    if (quizId) {
      const initialCount = user.pendingQuizzes.length;
      user.pendingQuizzes = user.pendingQuizzes.filter(
        (pendingQuiz) => pendingQuiz.quizId.toString() !== quizId
      );

      if (user.pendingQuizzes.length === initialCount) {
        return res.status(404).json({
          message: 'Specified quiz assignment not found for this user.',
        });
      }

      console.log(
        `Removed specific quiz assignment (ID: ${quizId}) from user '${user.email}'.`
      );
      await user.save();
      return res
        .status(200)
        .json({ message: 'Specific quiz assignment removed successfully' });
    }

    // Otherwise, remove all pending quizzes
    console.log(
      `User '${user.email}' has ${user.pendingQuizzes.length} pending quiz(es). Clearing all now.`
    );
    user.pendingQuizzes = [];
    await user.save();

    res
      .status(200)
      .json({ message: 'All quiz assignments removed successfully' });
  } catch (error) {
    console.error(
      `[CRITICAL] Failed to un-assign quiz. User: ${req.params.userId}. Error: ${error.message}`
    );
    res.status(500);
    throw new Error(`Server error: Could not un-assign quiz. ${error.message}`);
  }
});

// @desc    Automatically assign time-based quizzes to users
// @route   POST /api/quizzes/auto-assign
// @access  Admin (can be called by cron job)
const autoAssignQuizzes = asyncHandler(async (req, res) => {
  console.log('--- Starting automatic quiz assignment process ---');

  try {
    // Find a system admin user for assignments (fallback to any admin)
    const systemUser = await User.findOne({ isAdmin: true });
    if (!systemUser) {
      throw new Error('No admin user found for system assignments');
    }

    // Get all active time-based quizzes
    const timeBasedQuizzes = await Quiz.find({
      isActive: true,
      triggerType: 'TIME_INTERVAL',
    });

    if (timeBasedQuizzes.length === 0) {
      console.log('No active time-based quizzes found.');
      const message = 'No time-based quizzes to assign';
      if (res && typeof res.status === 'function') {
        return res.status(200).json({ message, assignedCount: 0 });
      }
      return { message, assignedCount: 0 };
    }

    console.log(`Found ${timeBasedQuizzes.length} active time-based quizzes`);

    // Get all users
    const users = await User.find({});
    let totalAssigned = 0;

    for (const user of users) {
      const now = new Date();

      for (const quiz of timeBasedQuizzes) {
        // Calculate the reference date based on triggerStartFrom
        let referenceDate;
        switch (quiz.triggerStartFrom) {
          case 'FIRST_QUIZ':
            // Find the earliest quiz result from user's quiz results
            if (user.quizResults && user.quizResults.length > 0) {
              const sortedResults = user.quizResults.sort(
                (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
              );
              referenceDate = new Date(sortedResults[0].submittedAt);
            } else {
              console.log(
                `No first quiz found for user ${user.email}, using registration date as fallback.`
              );
              referenceDate = new Date(user.createdAt);
            }
            break;
          case 'LAST_QUIZ':
            // Find the latest quiz result from user's quiz results
            if (user.quizResults && user.quizResults.length > 0) {
              const sortedResults = user.quizResults.sort(
                (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
              );
              referenceDate = new Date(sortedResults[0].submittedAt);
            } else {
              console.log(
                `No last quiz found for user ${user.email}, using registration date as fallback.`
              );
              referenceDate = new Date(user.createdAt);
            }
            break;
          case 'REGISTRATION':
          default:
            referenceDate = new Date(user.createdAt);
            break;
        }

        // Calculate delay amount in milliseconds
        let delayMs = 0;
        const amount = quiz.triggerDelayAmount || quiz.triggerDelayDays || 0;
        const unit = quiz.triggerDelayUnit || 'days';

        if (amount > 0) {
          switch (unit) {
            case 'seconds':
              delayMs = amount * 1000;
              break;
            case 'minutes':
              delayMs = amount * 60 * 1000;
              break;
            case 'hours':
              delayMs = amount * 60 * 60 * 1000;
              break;
            case 'days':
              delayMs = amount * 24 * 60 * 60 * 1000;
              break;
            case 'weeks':
              delayMs = amount * 7 * 24 * 60 * 60 * 1000;
              break;
            default:
              delayMs = amount * 24 * 60 * 60 * 1000; // Default to days
              break;
          }
        }

        const triggerDate = new Date(referenceDate.getTime() + delayMs);

        // Check if quiz is already assigned
        const existingAssignment = user.pendingQuizzes.find(
          (pendingQuiz) => pendingQuiz.quizId.toString() === quiz._id.toString()
        );

        if (existingAssignment) {
          console.log(
            `Quiz "${quiz.name}" already assigned to user "${user.email}"`
          );
          // Update assignment properties if missing
          if (!existingAssignment.scheduledFor) {
            existingAssignment.scheduledFor = triggerDate;
            await user.save();
            console.log(
              `Updated scheduledFor for existing assignment: "${quiz.name}" for user "${user.email}"`
            );
          }
          continue;
        }

        // Check if user has already completed this quiz
        const completedQuiz = user.quizResults.find(
          (result) => result.quizId.toString() === quiz._id.toString()
        );

        if (completedQuiz) {
          console.log(
            `User "${user.email}" has already completed quiz "${quiz.name}"`
          );
          continue;
        }

        // Check if quiz has been skipped (admin removed future assignment)
        const skippedQuiz = user.skippedQuizzes?.find(
          (skipped) => skipped.quizId.toString() === quiz._id.toString()
        );

        if (skippedQuiz) {
          console.log(
            `Quiz "${quiz.name}" was skipped for user "${user.email}" (removed by admin)`
          );
          continue;
        }

        // Check if it's time to assign this quiz
        if (now >= triggerDate) {
          // Handle time frame based on the new timeFrameHandling field
          const timeFrameHandling =
            quiz.timeFrameHandling || 'RESPECT_TIMEFRAME';

          let shouldAssign = true;

          switch (timeFrameHandling) {
            case 'RESPECT_TIMEFRAME':
              if (!user.timeFrame?.isWithinTimeFrame) {
                console.log(
                  `Skipping quiz "${quiz.name}" for user "${user.email}" - outside time frame`
                );
                shouldAssign = false;
              }
              break;
            case 'ALL_USERS':
              // Allow all users regardless of time frame
              console.log(
                `Quiz "${quiz.name}" allows all users regardless of time frame`
              );
              break;
            case 'OUTSIDE_TIMEFRAME_ONLY':
              if (user.timeFrame?.isWithinTimeFrame) {
                console.log(
                  `Skipping quiz "${quiz.name}" for user "${user.email}" - within time frame, but quiz is for users outside time frame only`
                );
                shouldAssign = false;
              }
              break;
            default:
              // Fallback to legacy respectUserTimeFrame
              if (
                quiz.respectUserTimeFrame &&
                !user.timeFrame?.isWithinTimeFrame
              ) {
                console.log(
                  `Skipping quiz "${quiz.name}" for user "${user.email}" - outside time frame (legacy setting)`
                );
                shouldAssign = false;
              }
              break;
          }

          if (shouldAssign) {
            // Assign the quiz
            user.pendingQuizzes.push({
              quizId: quiz._id,
              assignedAt: new Date(),
              assignedBy: systemUser._id, // Use system admin user
              assignmentType: 'TIME_INTERVAL',
              scheduledFor: triggerDate,
              isAvailable: true,
            });

            await user.save();
            totalAssigned++;
            console.log(
              `Assigned quiz "${quiz.name}" to user "${user.email}" (due: ${triggerDate})`
            );
          }
        } else {
          // Log future assignments for debugging (only if within next 7 days)
          const daysUntil = Math.ceil(
            (triggerDate - now) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil <= 7) {
            console.log(
              `Quiz "${quiz.name}" for user "${user.email}" will be assigned in ${daysUntil} days (${triggerDate})`
            );
          }
        }
      }
    }

    console.log(
      `--- Auto-assignment completed. Total assigned: ${totalAssigned} ---`
    );

    if (res && typeof res.status === 'function') {
      res.status(200).json({
        message: 'Auto-assignment completed successfully',
        assignedCount: totalAssigned,
      });
    }

    return { assignedCount: totalAssigned }; // For direct function calls
  } catch (error) {
    console.error(`[CRITICAL] Auto-assignment failed: ${error.message}`);
    if (res && typeof res.status === 'function') {
      res.status(500);
      throw new Error(`Auto-assignment failed: ${error.message}`);
    }
    throw error;
  }
});

// @desc    Get future quiz assignments for a specific user
// @route   GET /api/quiz/future-assignments/:userId
// @access  Private/Admin
const getFutureQuizAssignments = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`--- Getting Future Quiz Assignments for User: ${userId} ---`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all active TIME_INTERVAL quizzes
    const timeBasedQuizzes = await Quiz.find({
      isActive: true,
      triggerType: 'TIME_INTERVAL',
    });

    if (timeBasedQuizzes.length === 0) {
      console.log('No active time-based quizzes found.');
      return res.status(200).json([]);
    }

    const futureAssignments = [];
    const now = new Date();

    for (const quiz of timeBasedQuizzes) {
      // Check if quiz is already assigned or completed
      const alreadyAssigned = user.pendingQuizzes.some(
        (pending) => pending.quizId.toString() === quiz._id.toString()
      );

      const alreadyCompleted = user.quizResults.some(
        (result) => result.quizId.toString() === quiz._id.toString()
      );

      const alreadySkipped = user.skippedQuizzes?.some(
        (skipped) => skipped.quizId.toString() === quiz._id.toString()
      );

      if (alreadyAssigned || alreadyCompleted || alreadySkipped) {
        continue; // Skip if already assigned, completed, or skipped
      }

      // Calculate the reference date based on triggerStartFrom
      let referenceDate;
      switch (quiz.triggerStartFrom) {
        case 'FIRST_QUIZ':
          if (user.quizResults && user.quizResults.length > 0) {
            const sortedResults = user.quizResults.sort(
              (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
            );
            referenceDate = new Date(sortedResults[0].submittedAt);
          } else {
            referenceDate = new Date(user.createdAt);
          }
          break;
        case 'LAST_QUIZ':
          if (user.quizResults && user.quizResults.length > 0) {
            const sortedResults = user.quizResults.sort(
              (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
            );
            referenceDate = new Date(sortedResults[0].submittedAt);
          } else {
            referenceDate = new Date(user.createdAt);
          }
          break;
        case 'REGISTRATION':
        default:
          referenceDate = new Date(user.createdAt);
          break;
      }

      // Calculate delay amount in milliseconds
      let delayMs = 0;
      const amount = quiz.triggerDelayAmount || quiz.triggerDelayDays || 0;
      const unit = quiz.triggerDelayUnit || 'days';

      if (amount > 0) {
        switch (unit) {
          case 'seconds':
            delayMs = amount * 1000;
            break;
          case 'minutes':
            delayMs = amount * 60 * 1000;
            break;
          case 'hours':
            delayMs = amount * 60 * 60 * 1000;
            break;
          case 'days':
            delayMs = amount * 24 * 60 * 60 * 1000;
            break;
          case 'weeks':
            delayMs = amount * 7 * 24 * 60 * 60 * 1000;
            break;
          default:
            delayMs = amount * 24 * 60 * 60 * 1000; // Default to days
            break;
        }
      }

      const triggerDate = new Date(referenceDate.getTime() + delayMs);

      // Add to future assignments if trigger date is in the future
      if (triggerDate > now) {
        futureAssignments.push({
          quiz: {
            _id: quiz._id,
            name: quiz.name,
            triggerType: quiz.triggerType,
            triggerDelayAmount:
              quiz.triggerDelayAmount || quiz.triggerDelayDays || 0,
            triggerDelayUnit: quiz.triggerDelayUnit || 'days',
            triggerStartFrom: quiz.triggerStartFrom || 'REGISTRATION',
            timeFrameHandling: quiz.timeFrameHandling || 'RESPECT_TIMEFRAME',
            respectUserTimeFrame: quiz.respectUserTimeFrame,
            homePageMessage: quiz.homePageMessage,
            questions: quiz.questions,
            isActive: quiz.isActive,
          },
          scheduledFor: triggerDate,
          referenceDate: referenceDate,
          referenceType: quiz.triggerStartFrom || 'REGISTRATION',
          delayAmount: amount,
          delayUnit: unit,
          timeUntilAssignment: triggerDate - now, // Milliseconds until assignment
          willRespectTimeFrame:
            quiz.timeFrameHandling === 'RESPECT_TIMEFRAME' ||
            (quiz.timeFrameHandling === 'OUTSIDE_TIMEFRAME_ONLY'
              ? false
              : quiz.respectUserTimeFrame !== false),
        });
      }
    }

    // Sort by scheduled date (earliest first)
    futureAssignments.sort(
      (a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor)
    );

    console.log(
      `Found ${futureAssignments.length} future quiz assignments for user ${user.email}`
    );
    res.status(200).json(futureAssignments);
  } catch (error) {
    console.error('Error getting future quiz assignments:', error);
    res
      .status(500)
      .json({ message: 'Server error getting future quiz assignments' });
  }
});

// @desc    Remove a future quiz assignment (prevent it from being auto-assigned)
// @route   DELETE /api/quiz/future-assignments/:userId/:quizId
// @access  Private/Admin
const removeFutureQuizAssignment = asyncHandler(async (req, res) => {
  try {
    const { userId, quizId } = req.params;
    console.log(
      `--- Removing Future Quiz Assignment: Quiz ${quizId} for User ${userId} ---`
    );

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // For TIME_INTERVAL quizzes, we need to mark them as "skipped" or "excluded"
    // We can add an excluded quiz list to the user model, or we can temporarily
    // complete the quiz with a special marker

    // Add a "skipped" entry to prevent future auto-assignment
    const skipEntry = {
      quizId: quiz._id,
      skippedAt: new Date(),
      skippedBy: req.user._id,
      reason: 'Admin removed future assignment',
    };

    // Initialize skippedQuizzes array if it doesn't exist
    if (!user.skippedQuizzes) {
      user.skippedQuizzes = [];
    }

    // Check if already skipped
    const alreadySkipped = user.skippedQuizzes.some(
      (skipped) => skipped.quizId.toString() === quizId
    );

    if (alreadySkipped) {
      return res
        .status(400)
        .json({ message: 'Quiz assignment already removed' });
    }

    user.skippedQuizzes.push(skipEntry);
    await user.save();

    console.log(
      `Successfully removed future assignment of quiz "${quiz.name}" for user "${user.email}"`
    );
    res.status(200).json({
      message: 'Future quiz assignment removed successfully',
      skippedQuiz: {
        quizId: quiz._id,
        quizName: quiz.name,
        skippedAt: skipEntry.skippedAt,
      },
    });
  } catch (error) {
    console.error('Error removing future quiz assignment:', error);
    res
      .status(500)
      .json({ message: 'Server error removing future quiz assignment' });
  }
});

export {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuizAnswers,
  getQuizResultsForUser,
  getActiveQuizForUser,
  assignQuizToUser,
  unassignQuizFromUser,
  autoAssignQuizzes,
  getFutureQuizAssignments,
  removeFutureQuizAssignment,
};
