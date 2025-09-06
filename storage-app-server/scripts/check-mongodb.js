#!/usr/bin/env node

/**
 * MongoDB Check Script
 * Verifies the current state of collections and schema fields
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Product, Report, Client, Worksite } = require('../dist/collections');

async function checkMongoDB() {
  try {
    console.log('🔍 Checking MongoDB Collections and Schema...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // 1. Check Users Collection
    console.log('\n👥 USERS COLLECTION:');
    const users = await User.find({}).limit(5);
    console.log(`Total users: ${await User.countDocuments()}`);
    
    if (users.length > 0) {
      console.log('Sample user document:');
      console.log(JSON.stringify(users[0].toObject(), null, 2));
      
      // Check if hourly_cost field exists
      const userWithHourlyCost = await User.findOne({ hourly_cost: { $exists: true } });
      if (userWithHourlyCost) {
        console.log('✅ hourly_cost field exists in users');
      } else {
        console.log('❌ hourly_cost field NOT found in users');
      }
    } else {
      console.log('No users found in database');
    }
    
    // 2. Check Products Collection
    console.log('\n📦 PRODUCTS COLLECTION:');
    const products = await Product.find({}).limit(5);
    console.log(`Total products: ${await Product.countDocuments()}`);
    
    if (products.length > 0) {
      console.log('Sample product document:');
      console.log(JSON.stringify(products[0].toObject(), null, 2));
      
      // Check if unit_of_measure field exists
      const productWithUnit = await Product.findOne({ unit_of_measure: { $exists: true } });
      if (productWithUnit) {
        console.log('✅ unit_of_measure field exists in products');
      } else {
        console.log('❌ unit_of_measure field NOT found in products');
      }
    } else {
      console.log('No products found in database');
    }
    
    // 3. Check Reports Collection
    console.log('\n📋 REPORTS COLLECTION:');
    const reports = await Report.find({}).limit(3);
    console.log(`Total reports: ${await Report.countDocuments()}`);
    
    if (reports.length > 0) {
      console.log('Sample report document structure:');
      const sampleReport = reports[0].toObject();
      // Show only key fields to avoid overwhelming output
      console.log({
        _id: sampleReport._id,
        date: sampleReport.date,
        technician_id: sampleReport.technician_id,
        status: sampleReport.status,
        activities_count: sampleReport.activities?.length || 0,
        created: sampleReport.created,
        last_updated: sampleReport.last_updated
      });
    } else {
      console.log('No reports found in database');
    }
    
    // 4. Check Collections Info
    console.log('\n📊 COLLECTIONS INFO:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // 5. Test Creating New Documents
    console.log('\n🧪 TESTING NEW DOCUMENT CREATION:');
    
    // Test User creation
    try {
      const testUser = new User({
        name: 'Test User Schema',
        email: 'test-schema@example.com',
        role: 'user',
        passwordHash: 'test-hash',
        hourly_cost: 25.75
      });
      
      const userValidation = testUser.validateSync();
      if (userValidation) {
        console.log('❌ User validation failed:', userValidation.message);
      } else {
        console.log('✅ User validation passed');
        console.log(`   - hourly_cost: ${testUser.hourly_cost}`);
      }
    } catch (error) {
      console.log('❌ User creation test failed:', error.message);
    }
    
    // Test Product creation
    try {
      const testProduct = new Product({
        data_documento: 'TEST-SCHEMA-001',
        descrizione: 'Test Product Schema',
        descrizione_interna: 'Internal Test Schema',
        fornitore: 'Test Supplier',
        unit_of_measure: 'kg',
        prezzo_acquisto: 15.99
      });
      
      const productValidation = testProduct.validateSync();
      if (productValidation) {
        console.log('❌ Product validation failed:', productValidation.message);
      } else {
        console.log('✅ Product validation passed');
        console.log(`   - unit_of_measure: ${testProduct.unit_of_measure}`);
      }
    } catch (error) {
      console.log('❌ Product creation test failed:', error.message);
    }
    
    console.log('\n✅ MongoDB check completed!');
    
  } catch (error) {
    console.error('❌ MongoDB check failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run check if called directly
if (require.main === module) {
  checkMongoDB();
}

module.exports = { checkMongoDB };
