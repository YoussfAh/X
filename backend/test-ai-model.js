import AiAnalysis from '../models/aiAnalysisModel.js';
import mongoose from 'mongoose';

console.log('Testing AI Analysis model import...');
console.log('Model loaded successfully:', AiAnalysis.modelName);

// Test schema validation
const testAnalysis = new AiAnalysis({
  user: new mongoose.Types.ObjectId(),
  prompt: 'Test prompt',
  analysisType: 'comprehensive',
  response: 'Test response',
  dataUsed: {
    workoutsCount: 5,
    dietCount: 10,
    sleepCount: 7,
    weightCount: 3,
    quizzesCount: 2
  }
});

console.log('Test analysis validation passed:', testAnalysis.validateSync() === undefined);
console.log('Model import test completed successfully!');
