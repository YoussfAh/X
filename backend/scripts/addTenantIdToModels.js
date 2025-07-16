import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Models that need tenantId added
const modelsToUpdate = [
  'aiAnalysisModel.js',
  'dietEntryModel.js',
  'exerciseModel.js',
  'orderModel.js',
  'progressImageModel.js',
  'quizModel.js',
  'sleepModel.js',
  'systemSettingsModel.js',
  'waterTrackingModel.js',
  'weightModel.js',
  'workoutEntryModel.js',
  'workoutSessionModel.js',
  'messageTemplateModel.js',
  'oneTimeCodeModel.js'
];

const tenantIdField = `    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },`;

modelsToUpdate.forEach(modelFile => {
  const filePath = path.join(__dirname, '..', 'models', modelFile);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if tenantId already exists
    if (content.includes('tenantId:')) {
      console.log(`✓ ${modelFile} already has tenantId`);
      return;
    }
    
    // Find the schema definition
    const schemaRegex = /const \w+Schema = mongoose\.Schema\(\s*\{/;
    const match = content.match(schemaRegex);
    
    if (match) {
      // Insert tenantId after the opening brace
      const insertPosition = match.index + match[0].length;
      content = content.slice(0, insertPosition) + '\n' + tenantIdField + content.slice(insertPosition);
      
      fs.writeFileSync(filePath, content);
      console.log(`✓ Updated ${modelFile}`);
    } else {
      console.log(`✗ Could not find schema definition in ${modelFile}`);
    }
  } catch (error) {
    console.error(`✗ Error updating ${modelFile}:`, error.message);
  }
});

console.log('\nDone! Remember to manually review the changes and ensure they are correct.'); 