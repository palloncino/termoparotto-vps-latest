#!/usr/bin/env node

/**
 * Database Migration Script
 * Adds new fields to existing collections:
 * - hourly_cost to users (default: 0)
 * - unit_of_measure to products (default: "pz")
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Product } = require('../dist/collections');

async function migrateSchema() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // 1. Update Users - Add hourly_cost field
    console.log('📝 Updating users with hourly_cost field...');
    const userResult = await User.updateMany(
      { hourly_cost: { $exists: false } },
      { $set: { hourly_cost: 0 } }
    );
    console.log(`✅ Updated ${userResult.modifiedCount} users`);
    
    // 2. Update Products - Add unit_of_measure field
    console.log('📝 Updating products with unit_of_measure field...');
    const productResult = await Product.updateMany(
      { unit_of_measure: { $exists: false } },
      { $set: { unit_of_measure: 'pz' } }
    );
    console.log(`✅ Updated ${productResult.modifiedCount} products`);
    
    // 3. Verify the changes
    console.log('🔍 Verifying migration...');
    
    const usersWithoutHourlyCost = await User.countDocuments({ hourly_cost: { $exists: false } });
    const productsWithoutUnit = await Product.countDocuments({ unit_of_measure: { $exists: false } });
    
    if (usersWithoutHourlyCost === 0 && productsWithoutUnit === 0) {
      console.log('✅ Migration completed successfully!');
      console.log('📊 Summary:');
      console.log(`   - Users updated: ${userResult.modifiedCount}`);
      console.log(`   - Products updated: ${productResult.modifiedCount}`);
    } else {
      console.log('⚠️  Some documents may not have been updated:');
      console.log(`   - Users without hourly_cost: ${usersWithoutHourlyCost}`);
      console.log(`   - Products without unit_of_measure: ${productsWithoutUnit}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateSchema();
}

module.exports = { migrateSchema };
