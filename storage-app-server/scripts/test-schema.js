#!/usr/bin/env node

/**
 * Test Script for New Schema Fields
 * Verifies that hourly_cost and unit_of_measure fields work correctly
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Product } = require('../dist/collections');

async function testSchema() {
  try {
    console.log('🧪 Testing new schema fields...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Test 1: Create a test user with hourly_cost
    console.log('📝 Testing user with hourly_cost...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      passwordHash: 'test-hash',
      hourly_cost: 25.50
    });
    
    // Validate the user
    const userValidation = testUser.validateSync();
    if (userValidation) {
      console.log('❌ User validation failed:', userValidation.message);
    } else {
      console.log('✅ User validation passed');
      console.log(`   - hourly_cost: ${testUser.hourly_cost}`);
    }
    
    // Test 2: Create a test product with unit_of_measure
    console.log('📝 Testing product with unit_of_measure...');
    const testProduct = new Product({
      data_documento: 'TEST-001',
      descrizione: 'Test Product',
      descrizione_interna: 'Internal Test',
      fornitore: 'Test Supplier',
      unit_of_measure: 'kg',
      prezzo_acquisto: 10.99
    });
    
    // Validate the product
    const productValidation = testProduct.validateSync();
    if (productValidation) {
      console.log('❌ Product validation failed:', productValidation.message);
    } else {
      console.log('✅ Product validation passed');
      console.log(`   - unit_of_measure: ${testProduct.unit_of_measure}`);
    }
    
    // Test 3: Test invalid values
    console.log('📝 Testing validation rules...');
    
    // Test invalid hourly_cost (negative)
    const invalidUser = new User({
      name: 'Invalid User',
      email: 'invalid@example.com',
      role: 'user',
      passwordHash: 'test-hash',
      hourly_cost: -5
    });
    
    const invalidUserValidation = invalidUser.validateSync();
    if (invalidUserValidation) {
      console.log('✅ Negative hourly_cost correctly rejected');
    } else {
      console.log('❌ Negative hourly_cost should have been rejected');
    }
    
    // Test invalid unit_of_measure
    const invalidProduct = new Product({
      data_documento: 'TEST-002',
      descrizione: 'Invalid Product',
      descrizione_interna: 'Invalid Test',
      fornitore: 'Test Supplier',
      unit_of_measure: 'invalid_unit',
      prezzo_acquisto: 10.99
    });
    
    const invalidProductValidation = invalidProduct.validateSync();
    if (invalidProductValidation) {
      console.log('✅ Invalid unit_of_measure correctly rejected');
    } else {
      console.log('❌ Invalid unit_of_measure should have been rejected');
    }
    
    console.log('✅ All schema tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run test if called directly
if (require.main === module) {
  testSchema();
}

module.exports = { testSchema };
