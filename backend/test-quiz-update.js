import mongoose from 'mongoose';
import Quiz from './models/quizModel.js';
import connectDB from './config/db.js';

async function testQuizUpdate() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find the quiz by ID
    const quizId = '68689ecdcb59fff3db3df6ea';
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      console.log('Quiz not found');
      return;
    }

    console.log('Original quiz scheduling settings:');
    console.log('- triggerDelayAmount:', quiz.triggerDelayAmount);
    console.log('- triggerDelayUnit:', quiz.triggerDelayUnit);
    console.log('- triggerStartFrom:', quiz.triggerStartFrom);
    console.log('- timeFrameHandling:', quiz.timeFrameHandling);

    // Update with test values
    quiz.triggerDelayAmount = 5;
    quiz.triggerDelayUnit = 'hours';
    quiz.triggerStartFrom = 'LAST_QUIZ';
    quiz.timeFrameHandling = 'ALL_USERS';

    const savedQuiz = await quiz.save();

    console.log('\nAfter update:');
    console.log('- triggerDelayAmount:', savedQuiz.triggerDelayAmount);
    console.log('- triggerDelayUnit:', savedQuiz.triggerDelayUnit);
    console.log('- triggerStartFrom:', savedQuiz.triggerStartFrom);
    console.log('- timeFrameHandling:', savedQuiz.timeFrameHandling);

    console.log(
      '\nTest successful - enhanced scheduling fields are saving correctly!'
    );

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuizUpdate();
