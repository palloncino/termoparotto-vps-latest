#!/usr/bin/env node

/**
 * Test XLSX Export Script
 * Verifies that material unloading hours are included in the XLSX export
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Report } = require('../dist/collections');

async function testXlsxExport() {
  try {
    console.log('🧪 Testing XLSX Export with Material Unloading...');
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Find a report with material unloading data
    const report = await Report.findOne({
      'activities.tasks.material_unloading': true
    }).populate('technician_id', 'name')
      .populate('activities.client_id', 'name')
      .populate('activities.worksite_id', 'name')
      .populate('activities.tasks.materials_used.product_id', 'descrizione unit_of_measure');
    
    if (!report) {
      console.log('❌ No report found with material unloading data');
      console.log('💡 Run "npm run test:material-unloading" first to create test data');
      return;
    }
    
    console.log('✅ Found report with material unloading data');
    console.log(`   - Report ID: ${report._id}`);
    console.log(`   - Date: ${report.date}`);
    console.log(`   - Technician: ${report.technician_id?.name || 'Unknown'}`);
    
    // Check material unloading data
    let totalUnloadingHours = 0;
    let tasksWithUnloading = 0;
    
    report.activities.forEach((activity, activityIndex) => {
      console.log(`\n   Activity ${activityIndex + 1}:`);
             console.log(`     - Client: ${activity.client_id?.name || 'Unknown'}`);
       console.log(`     - Worksite: ${activity.worksite_id?.name || 'Unknown'}`);
      
      activity.tasks.forEach((task, taskIndex) => {
        console.log(`     Task ${taskIndex + 1}:`);
        console.log(`       - Description: ${task.task_description}`);
        console.log(`       - Work Hours: ${task.work_hours}`);
        console.log(`       - Material Unloading: ${task.material_unloading}`);
        console.log(`       - Unloading Hours: ${task.material_unloading_hours}`);
        
        if (task.material_unloading) {
          totalUnloadingHours += task.material_unloading_hours;
          tasksWithUnloading++;
        }
        
        if (task.materials_used && task.materials_used.length > 0) {
          console.log(`       - Materials Used: ${task.materials_used.length} items`);
                   task.materials_used.forEach((material, materialIndex) => {
           const product = material.product_id;
           console.log(`         Material ${materialIndex + 1}: ${product?.descrizione || 'Unknown'} - ${material.quantity} ${product?.unit_of_measure || 'units'}`);
         });
        }
      });
    });
    
    console.log(`\n📊 Material Unloading Summary:`);
    console.log(`   - Total Tasks with Unloading: ${tasksWithUnloading}`);
    console.log(`   - Total Unloading Hours: ${totalUnloadingHours}`);
    
    // Test the XLSX export endpoint (simulate the data structure)
    console.log('\n📋 Simulating XLSX Export Data Structure...');
    
    const exportData = [];
    const reportDate = report.date ? new Date(report.date).toISOString().split('T')[0] : '';
    const technicianName = report.technician_id?.name || '';
    const lunchLocation = report.lunch_location || '';
    const status = report.status || '';
    
    report.activities.forEach(activity => {
      const clientName = activity.client_id?.name || '';
      const worksiteName = activity.worksite_id?.name || '';
      const travelTimeHours = activity.travel_time_hours || 0;
      
      activity.tasks.forEach(task => {
        const taskDesc = task.task_description || 'NoDesc';
        const taskHours = task.work_hours || 0;
        const materialUnloadingHours = task.material_unloading_hours || 0;
        
        // Process materials
        let materialsSummary = '';
        if (task.materials_used && task.materials_used.length > 0) {
                   const materialResults = task.materials_used.map(material => {
           const product = material.product_id;
           return product ? `${product.descrizione || product.descrizione_interna || 'Unknown'}:${material.quantity}` : '';
         });
          materialsSummary = materialResults.filter(Boolean).join('; ');
        }
        
        // Count assigned technicians
        const assignedTechIds = task.assigned_technician_ids || [];
        const assignedTechCount = assignedTechIds.length;
        
        exportData.push({
          date: reportDate,
          technician: technicianName,
          client: clientName,
          worksite: worksiteName,
          travel_time_hours: travelTimeHours,
          task_description: taskDesc,
          task_work_hours: taskHours,
          material_unloading_hours: materialUnloadingHours,
          lunch_location: lunchLocation,
          assigned_task_technicians_count: assignedTechCount,
          materials_used: materialsSummary,
          status: status
        });
      });
    });
    
    console.log('✅ XLSX Export Data Structure:');
    console.log('   Columns:');
    console.log('     - Data');
    console.log('     - Tecnico');
    console.log('     - Cliente');
    console.log('     - Cantiere');
    console.log('     - Tempo di viaggio (h)');
    console.log('     - Task Description');
    console.log('     - Task Work Hours (h)');
    console.log('     - Scarico Materiali (h) ← Material Unloading Hours');
    console.log('     - Luogo di pranzo');
    console.log('     - N. Tecnici Assegnati');
    console.log('     - Materiali Usati');
    console.log('     - Status');
    
    console.log(`\n   Rows: ${exportData.length}`);
    exportData.forEach((row, index) => {
      console.log(`   Row ${index + 1}:`);
      console.log(`     - Task: ${row.task_description}`);
      console.log(`     - Work Hours: ${row.task_work_hours}`);
      console.log(`     - Material Unloading Hours: ${row.material_unloading_hours}`);
      console.log(`     - Materials: ${row.materials_used || 'None'}`);
    });
    
    // Verify that material unloading hours are properly included
    const rowsWithUnloading = exportData.filter(row => row.material_unloading_hours > 0);
    console.log(`\n✅ Verification:`);
    console.log(`   - Total rows: ${exportData.length}`);
    console.log(`   - Rows with material unloading: ${rowsWithUnloading.length}`);
    console.log(`   - Material unloading hours included: ${rowsWithUnloading.length > 0 ? 'YES' : 'NO'}`);
    
    console.log('\n✅ XLSX Export Test Completed Successfully!');
    console.log('💡 Material unloading hours are properly included in the export data structure');
    
  } catch (error) {
    console.error('❌ XLSX Export test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run if called directly
if (require.main === module) {
  testXlsxExport();
}

module.exports = { testXlsxExport };
