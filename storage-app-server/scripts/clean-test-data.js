#!/usr/bin/env node

/**
 * Clean Test Data Script
 * Removes test data created for schema verification
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Product, Client, Worksite } = require('../dist/collections');

async function cleanTestData() {
  try {
    console.log('🧹 Cleaning up test data...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // 1. Remove test users
    console.log('\n👥 Removing test users...');
    const userResult = await User.deleteMany({
      email: { 
        $in: [
          'admin@termoparotto.com',
          'tech1@termoparotto.com', 
          'tech2@termoparotto.com'
        ]
      }
    });
    console.log(`✅ Removed ${userResult.deletedCount} test users`);
    
    // 2. Remove test products
    console.log('\n📦 Removing test products...');
    const productResult = await Product.deleteMany({
      data_documento: { 
        $in: ['PROD-001', 'PROD-002', 'PROD-003'] 
      }
    });
    console.log(`✅ Removed ${productResult.deletedCount} test products`);
    
    // 3. Remove test clients
    console.log('\n🏢 Removing test clients...');
    const clientResult = await Client.deleteMany({
      name: { 
        $in: ['Client Alpha', 'Client Beta'] 
      }
    });
    console.log(`✅ Removed ${clientResult.deletedCount} test clients`);
    
    // 4. Remove test worksites
    console.log('\n🏗️ Removing test worksites...');
    const worksiteResult = await Worksite.deleteMany({
      name: { 
        $in: ['Worksite Alpha A', 'Worksite Beta B'] 
      }
    });
    console.log(`✅ Removed ${worksiteResult.deletedCount} test worksites`);
    
    // 5. Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const clientCount = await Client.countDocuments();
    const worksiteCount = await Worksite.countDocuments();
    
    console.log('📊 Database Summary after cleanup:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Clients: ${clientCount}`);
    console.log(`   - Worksites: ${worksiteCount}`);
    
    console.log('\n✅ Test data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run if called directly
if (require.main === module) {
  cleanTestData();
}

module.exports = { cleanTestData };
