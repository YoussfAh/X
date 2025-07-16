#!/usr/bin/env node

/**
 * Vercel Deployment Verification Script
 * Tests if your project is ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Vercel Deployment Verification\n');

const checks = [
    {
        name: '📦 Root package.json has build script',
        test: () => {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.scripts && (packageJson.scripts.build || packageJson.scripts['build:frontend']);
        }
    },
    {
        name: '📁 Frontend build directory exists',
        test: () => fs.existsSync('frontend/build') && fs.existsSync('frontend/build/index.html')
    },
    {
        name: '⚙️ Vercel.json configuration exists',
        test: () => fs.existsSync('vercel.json') && fs.readFileSync('vercel.json', 'utf8').trim().length > 0
    },
    {
        name: '🔧 Frontend package.json has build script',
        test: () => {
            const packageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
            return packageJson.scripts && packageJson.scripts.build;
        }
    },
    {
        name: '📋 Frontend build command works',
        test: () => {
            try {
                execSync('npm run build:frontend', { stdio: 'pipe' });
                return fs.existsSync('frontend/build/index.html');
            } catch (error) {
                return false;
            }
        }
    },
    {
        name: '🌐 Environment example file exists',
        test: () => fs.existsSync('frontend/.env.example')
    }
];

let passedChecks = 0;
const totalChecks = checks.length;

console.log('Running deployment readiness checks...\n');

checks.forEach((check, index) => {
    try {
        const passed = check.test();
        const status = passed ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${check.name}`);
        if (passed) passedChecks++;
    } catch (error) {
        console.log(`${index + 1}. ❌ ${check.name} (Error: ${error.message})`);
    }
});

console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed\n`);

if (passedChecks === totalChecks) {
    console.log('🎉 SUCCESS! Your project is ready for Vercel deployment!');
    console.log('\n📋 Next steps:');
    console.log('1. Push your changes to Git');
    console.log('2. Go to Vercel Dashboard');
    console.log('3. Create new project from Git');
    console.log('4. Set Root Directory to "." (root)');
    console.log('5. Build Command: npm run build:frontend');
    console.log('6. Output Directory: frontend/build');
    console.log('7. Add environment variables');
    console.log('8. Deploy!');
} else {
    console.log('⚠️  Some checks failed. Please review the issues above.');
    console.log('\n🔧 Quick fixes:');
    console.log('- Run: npm run build:frontend');
    console.log('- Check if frontend/build/index.html exists');
    console.log('- Verify vercel.json configuration');
}

console.log('\n📚 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions');
