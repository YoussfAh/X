import connectDB from '../config/db.js';
import User from '../models/userModel.js';

// Set super admin privileges for specified users
const setSuperAdmin = async () => {
  try {
    await connectDB();
    console.log('Setting super admin privileges for:', process.argv.slice(2).join(', '));

    const emails = process.argv.slice(2);
    
    if (emails.length === 0) {
      console.log('Usage: node setSuperAdmin.js <email1> [email2] [email3] ...');
      console.log('Example: node setSuperAdmin.js 123456@email.com admin@email.com');
      process.exit(1);
    }

    const results = [];
    
    for (const email of emails) {
      try {
        const user = await User.findOne({ email });
        
        if (user) {
          user.isSuperAdmin = true;
          user.isAdmin = true; // Super admins should also be regular admins
          await user.save();
          results.push({ email, status: 'success' });
          console.log(`✅ ${email} is now a Super Admin`);
        } else {
          results.push({ email, status: 'not found' });
          console.log(`❌ User not found: ${email}`);
        }
      } catch (error) {
        results.push({ email, status: 'error', message: error.message });
        console.log(`❌ Error processing ${email}: ${error.message}`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    results.forEach(result => {
      if (result.status === 'success') {
        console.log(`✅ ${result.email}: ${result.status}`);
      } else {
        console.log(`❌ ${result.email}: ${result.status}`);
      }
    });
    
    console.log('\n🎉 Super Admin setup complete!');
    console.log('Super Admins can now access: /super-admin');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

setSuperAdmin(); 
 
 
 
 
 