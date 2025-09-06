#!/usr/bin/env node

/**
 * Test Material Unloading Script
 * Verifies that material unloading hours are properly handled in report creation/editing
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Product, Client, Worksite, Report } = require('../dist/collections');

async function testMaterialUnloading() {
  try {
    console.log('🧪 Testing Material Unloading Functionality...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // 1. Create test data if needed
    console.log('\n📝 Creating test data for material unloading test...');
    
    // Get or create a test user
    let testUser = await User.findOne({ email: 'test-material@termoparotto.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test Material User',
        email: 'test-material@termoparotto.com',
        role: 'user',
        passwordHash: 'test-hash',
        hourly_cost: 25.00,
        is_active: true,
        status: 'approved'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }
    
    // Get or create a test client
    let testClient = await Client.findOne({ name: 'Test Client Material' });
    if (!testClient) {
      testClient = new Client({
        name: 'Test Client Material',
        address: 'Test Address',
        contact_info: 'test@material.com'
      });
      await testClient.save();
      console.log('✅ Created test client');
    }
    
    // Get or create a test worksite
    let testWorksite = await Worksite.findOne({ name: 'Test Worksite Material' });
    if (!testWorksite) {
      testWorksite = new Worksite({
        client_id: testClient._id,
        name: 'Test Worksite Material',
        address: 'Test Worksite Address',
        description: 'Test worksite for material unloading',
        is_active: true,
        planned_hours: 40
      });
      await testWorksite.save();
      console.log('✅ Created test worksite');
    }
    
    // Get or create a test product
    let testProduct = await Product.findOne({ data_documento: 'TEST-MAT-001' });
    if (!testProduct) {
      testProduct = new Product({
        data_documento: 'TEST-MAT-001',
        descrizione: 'Test Material Product',
        descrizione_interna: 'Internal Test Material',
        fornitore: 'Test Supplier',
        unit_of_measure: 'kg',
        prezzo_acquisto: 5.50,
        utile: 1.50,
        imponibile: 7.00,
        iva_10: 0.00,
        iva_22: 1.54
      });
      await testProduct.save();
      console.log('✅ Created test product');
    }
    
    // 2. Test Report Creation with Material Unloading
    console.log('\n📋 Testing report creation with material unloading...');
    
    const testReportData = {
      header: {
        date: new Date().toISOString().split('T')[0],
        author_id: testUser._id,
        status: 'draft',
        lunch_location: 'Test Location'
      },
      activities: [
        {
          client_id: testClient._id,
          worksite_id: testWorksite._id,
          completed: false,
          travel_time_hours: 0.5,
          valid_travel_time: 'manual',
          tasks: [
            {
              assigned_technician_ids: [testUser._id],
              task_description: 'Test task with material unloading',
              work_hours: 4.0,
              material_unloading: true,
              material_unloading_hours: 1.5,
              materials_used: [
                {
                  product_id: testProduct._id,
                  quantity: 10
                }
              ]
            },
            {
              assigned_technician_ids: [testUser._id],
              task_description: 'Test task without material unloading',
              work_hours: 2.0,
              material_unloading: false,
              material_unloading_hours: 0,
              materials_used: []
            }
          ]
        }
      ]
    };
    
    // Create the report
    const newReport = new Report({
      date: new Date(testReportData.header.date),
      technician_id: testReportData.header.author_id,
      status: testReportData.header.status,
      lunch_location: testReportData.header.lunch_location,
      activities: testReportData.activities,
      created: new Date(),
      last_updated: new Date()
    });
    
    const savedReport = await newReport.save();
    console.log('✅ Report created successfully');
    console.log(`   - Report ID: ${savedReport._id}`);
    console.log(`   - Activities: ${savedReport.activities.length}`);
    console.log(`   - Tasks: ${savedReport.activities[0].tasks.length}`);
    
    // 3. Verify Material Unloading Data
    console.log('\n🔍 Verifying material unloading data...');
    
    const retrievedReport = await Report.findById(savedReport._id)
      .populate('technician_id', 'name')
      .populate('activities.client_id', 'name')
      .populate('activities.worksite_id', 'name')
      .populate('activities.tasks.materials_used.product_id', 'descrizione unit_of_measure');
    
    if (retrievedReport) {
      console.log('✅ Report retrieved successfully');
      
      retrievedReport.activities.forEach((activity, activityIndex) => {
        console.log(`\n   Activity ${activityIndex + 1}:`);
        console.log(`     - Client: ${activity.client_id?.name || 'Unknown'}`);
        console.log(`     - Worksite: ${activity.worksite_id?.name || 'Unknown'}`);
        
        activity.tasks.forEach((task, taskIndex) => {
          console.log(`     Task ${taskIndex + 1}:`);
          console.log(`       - Description: ${task.task_description}`);
          console.log(`       - Work Hours: ${task.work_hours}`);
          console.log(`       - Material Unloading: ${task.material_unloading}`);
          console.log(`       - Unloading Hours: ${task.material_unloading_hours}`);
          console.log(`       - Materials Used: ${task.materials_used.length} items`);
          
                     task.materials_used.forEach((material, materialIndex) => {
             const product = material.product_id;
             console.log(`         Material ${materialIndex + 1}: ${product?.descrizione || 'Unknown'} - ${material.quantity} ${product?.unit_of_measure || 'units'}`);
           });
        });
      });
    }
    
    // 4. Test Report Update with Material Unloading Changes
    console.log('\n📝 Testing report update with material unloading changes...');
    
    const updateData = {
      activities: [
        {
          client_id: testClient._id,
          worksite_id: testWorksite._id,
          completed: false,
          travel_time_hours: 0.5,
          valid_travel_time: 'manual',
          tasks: [
            {
              assigned_technician_ids: [testUser._id],
              task_description: 'Updated task with increased material unloading',
              work_hours: 4.0,
              material_unloading: true,
              material_unloading_hours: 2.5, // Increased from 1.5
              materials_used: [
                {
                  product_id: testProduct._id,
                  quantity: 15 // Increased from 10
                }
              ]
            }
          ]
        }
      ]
    };
    
    const updatedReport = await Report.findByIdAndUpdate(
      savedReport._id,
      { 
        activities: updateData.activities,
        last_updated: new Date()
      },
      { new: true }
    ).populate('technician_id', 'name')
     .populate('activities.client_id', 'name')
     .populate('activities.worksite_id', 'name')
     .populate('activities.tasks.materials_used.product_id', 'descrizione unit_of_measure');
    
    if (updatedReport) {
      console.log('✅ Report updated successfully');
      const task = updatedReport.activities[0].tasks[0];
      console.log(`   - Updated Unloading Hours: ${task.material_unloading_hours}`);
      console.log(`   - Updated Material Quantity: ${task.materials_used[0].quantity}`);
    }
    
    // 5. Test Validation Rules
    console.log('\n🧪 Testing validation rules...');
    
    // Test invalid material unloading hours (negative)
    try {
      const invalidReport = new Report({
        date: new Date(),
        technician_id: testUser._id,
        status: 'draft',
        activities: [
          {
            client_id: testClient._id,
            worksite_id: testWorksite._id,
            tasks: [
              {
                task_description: 'Invalid task',
                work_hours: 2.0,
                material_unloading: true,
                material_unloading_hours: -1, // Invalid negative value
                materials_used: []
              }
            ]
          }
        ]
      });
      
      await invalidReport.save();
      console.log('❌ Invalid report should have been rejected');
    } catch (error) {
      console.log('✅ Invalid report correctly rejected (negative hours)');
    }
    
    // Test material unloading false but hours > 0
    try {
      const inconsistentReport = new Report({
        date: new Date(),
        technician_id: testUser._id,
        status: 'draft',
        activities: [
          {
            client_id: testClient._id,
            worksite_id: testWorksite._id,
            tasks: [
              {
                task_description: 'Inconsistent task',
                work_hours: 2.0,
                material_unloading: false,
                material_unloading_hours: 1.5, // Hours > 0 but unloading = false
                materials_used: []
              }
            ]
          }
        ]
      });
      
      const savedInconsistentReport = await inconsistentReport.save();
      console.log('✅ Inconsistent report saved (validation will handle this)');
      
      // Check if the validation function corrected the data
      const retrievedInconsistentReport = await Report.findById(savedInconsistentReport._id);
      const task = retrievedInconsistentReport.activities[0].tasks[0];
      console.log(`   - Final material_unloading: ${task.material_unloading}`);
      console.log(`   - Final material_unloading_hours: ${task.material_unloading_hours}`);
      
      if (task.material_unloading === false && task.material_unloading_hours === 0) {
        console.log('✅ Validation correctly corrected inconsistent data');
      } else {
        console.log('❌ Validation did not correct inconsistent data');
      }
    } catch (error) {
      console.log('❌ Inconsistent report save failed:', error.message);
    }
    
    console.log('\n✅ Material unloading functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Material unloading test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run if called directly
if (require.main === module) {
  testMaterialUnloading();
}

module.exports = { testMaterialUnloading };
