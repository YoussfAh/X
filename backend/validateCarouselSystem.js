#!/usr/bin/env node

import fetch from 'node-fetch';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

class CarouselSystemValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
        console.log(`[${timestamp}] ${emoji} ${message}`);
        
        if (type === 'success') this.successes.push(message);
        else if (type === 'warning') this.warnings.push(message);
        else this.errors.push(message);
    }

    async validateBackendAPI() {
        console.log('\n🔍 Validating Backend API...');
        
        try {
            // Test carousel slides endpoint
            const slidesResponse = await fetch(`${API_BASE}/api/system-settings/carousel`);
            if (slidesResponse.ok) {
                const slides = await slidesResponse.json();
                this.log('success', `Carousel slides API working (${slides.length} slides)`);
                
                // Validate slide structure
                if (slides.length > 0) {
                    const slide = slides[0];
                    const requiredFields = ['image', 'link', 'alt', 'isExternal'];
                    const missingFields = requiredFields.filter(field => !slide.hasOwnProperty(field));
                    
                    if (missingFields.length === 0) {
                        this.log('success', 'Slide data structure is valid');
                    } else {
                        this.log('error', `Missing slide fields: ${missingFields.join(', ')}`);
                    }
                }
            } else {
                this.log('error', 'Carousel slides API not responding');
            }

            // Test carousel settings endpoint
            const settingsResponse = await fetch(`${API_BASE}/api/system-settings/carousel-settings`);
            if (settingsResponse.ok) {
                const settings = await settingsResponse.json();
                this.log('success', `Carousel settings API working (${settings.autoPlayInterval}ms autoplay)`);
            } else {
                this.log('error', 'Carousel settings API not responding');
            }

        } catch (error) {
            this.log('error', `Backend API validation failed: ${error.message}`);
        }
    }

    validateFileStructure() {
        console.log('\n📁 Validating File Structure...');
        
        const criticalFiles = [
            'frontend/src/components/TopHeroCarousel.jsx',
            'frontend/src/components/admin/SystemCarouselManager.jsx',
            'frontend/src/slices/systemApiSlice.js',
            'backend/controllers/systemSettingsController.js',
            'backend/models/systemSettingsModel.js',
            'backend/routes/systemSettingsRoutes.js'
        ];

        criticalFiles.forEach(filePath => {
            const fullPath = path.join(process.cwd(), '..', filePath);
            if (fs.existsSync(fullPath)) {
                this.log('success', `File exists: ${filePath}`);
            } else {
                this.log('error', `Missing critical file: ${filePath}`);
            }
        });
    }

    async validateFrontendIntegration() {
        console.log('\n🌐 Validating Frontend Integration...');
        
        try {
            // Check if frontend is running
            const frontendResponse = await fetch(FRONTEND_URL);
            if (frontendResponse.ok) {
                this.log('success', 'Frontend server is running');
            } else {
                this.log('warning', 'Frontend server not responding');
            }

            // Check admin route
            const adminResponse = await fetch(`${FRONTEND_URL}/admin/system-settings`);
            if (adminResponse.ok) {
                this.log('success', 'Admin system settings page accessible');
            } else {
                this.log('warning', 'Admin system settings page not accessible (may require login)');
            }

        } catch (error) {
            this.log('warning', `Frontend validation limited: ${error.message}`);
        }
    }

    validateDatabaseSchema() {
        console.log('\n🗄️ Validating Database Schema...');
        
        // Check if systemSettingsModel exists and has correct structure
        const modelPath = path.join(process.cwd(), 'models', 'systemSettingsModel.js');
        if (fs.existsSync(modelPath)) {
            const modelContent = fs.readFileSync(modelPath, 'utf8');
            
            const requiredSchemas = ['carouselSlideSchema', 'systemSettingsSchema'];
            requiredSchemas.forEach(schema => {
                if (modelContent.includes(schema)) {
                    this.log('success', `Database schema includes ${schema}`);
                } else {
                    this.log('error', `Missing database schema: ${schema}`);
                }
            });

            // Check for required fields
            const requiredFields = ['image', 'mobileImage', 'link', 'isExternal', 'alt', 'mobileDisplayMode'];
            requiredFields.forEach(field => {
                if (modelContent.includes(field)) {
                    this.log('success', `Database field defined: ${field}`);
                } else {
                    this.log('warning', `Database field may be missing: ${field}`);
                }
            });
        } else {
            this.log('error', 'SystemSettings model file not found');
        }
    }

    async validateAdminFunctionality() {
        console.log('\n⚙️ Validating Admin Functionality...');
        
        try {
            // Test if admin endpoints are protected
            const testUpdate = await fetch(`${API_BASE}/api/system-settings/carousel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carouselSlides: [] })
            });

            if (testUpdate.status === 401 || testUpdate.status === 403) {
                this.log('success', 'Admin endpoints properly protected');
            } else if (testUpdate.status === 200) {
                this.log('warning', 'Admin endpoints accessible without auth (development mode)');
            } else {
                this.log('error', 'Unexpected response from admin endpoint');
            }

        } catch (error) {
            this.log('error', `Admin functionality test failed: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 VALIDATION REPORT');
        console.log('='.repeat(50));
        
        console.log(`\n✅ Successes: ${this.successes.length}`);
        this.successes.forEach(success => console.log(`   • ${success}`));
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️ Warnings: ${this.warnings.length}`);
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Errors: ${this.errors.length}`);
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        // Overall status
        console.log('\n🎯 OVERALL STATUS:');
        if (this.errors.length === 0) {
            if (this.warnings.length === 0) {
                console.log('🎉 EXCELLENT: Instance Hero Carousel is fully operational!');
            } else {
                console.log('✅ GOOD: Instance Hero Carousel is working with minor warnings');
            }
        } else {
            console.log('⚠️ ISSUES DETECTED: Please review errors above');
        }

        // Next steps
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Access admin panel: http://localhost:3000/admin/system-settings');
        console.log('2. Click "Hero Carousel" tab');
        console.log('3. Add/edit carousel slides');
        console.log('4. View changes at: http://localhost:3000/home');
        console.log('5. All users will see admin changes immediately');
    }

    async runValidation() {
        console.log('🚀 Instance Hero Carousel System Validation');
        console.log('='.repeat(50));
        
        this.validateFileStructure();
        this.validateDatabaseSchema();
        await this.validateBackendAPI();
        await this.validateFrontendIntegration();
        await this.validateAdminFunctionality();
        
        this.generateReport();
    }
}

// Run validation
const validator = new CarouselSystemValidator();
validator.runValidation().catch(console.error);
