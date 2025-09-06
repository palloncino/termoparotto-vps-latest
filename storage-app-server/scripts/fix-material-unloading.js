const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Report } = require('../dist/collections');

async function fixMaterialUnloading() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    console.log('🔧 Fixing Material Unloading Data Inconsistencies...');
    
    const reports = await Report.find({}).lean();
    console.log(`Total reports to check: ${reports.length}`);
    
    let fixedCount = 0;
    
    for (const report of reports) {
      let needsUpdate = false;
      const updateData = { $set: {} };
      
      if (report.activities && report.activities.length > 0) {
        report.activities.forEach((activity, actIndex) => {
          if (activity.tasks && activity.tasks.length > 0) {
            activity.tasks.forEach((task, taskIndex) => {
              const taskPath = `activities.${actIndex}.tasks.${taskIndex}`;
              
              // Fix negative material_unloading_hours
              if (task.material_unloading_hours < 0) {
                updateData.$set[`${taskPath}.material_unloading_hours`] = 0;
                needsUpdate = true;
                console.log(`  📝 Report ${report._id}: Fixed negative hours in task ${taskIndex + 1}`);
              }
              
              // Fix inconsistent data: if material_unloading is false, hours should be 0
              if (task.material_unloading === false && task.material_unloading_hours > 0) {
                updateData.$set[`${taskPath}.material_unloading_hours`] = 0;
                needsUpdate = true;
                console.log(`  📝 Report ${report._id}: Fixed inconsistent hours in task ${taskIndex + 1}`);
              }
            });
          }
        });
      }
      
      if (needsUpdate) {
        await Report.updateOne({ _id: report._id }, updateData);
        fixedCount++;
      }
    }
    
    console.log(`\n✅ Data cleanup completed!`);
    console.log(`📊 Reports fixed: ${fixedCount}`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const updatedReports = await Report.find({}).lean();
    
    updatedReports.forEach((report, index) => {
      console.log(`\n📄 Report ${index + 1} (${report._id}):`);
      console.log(`  Status: ${report.status}`);
      
      if (report.activities && report.activities.length > 0) {
        report.activities.forEach((activity, actIndex) => {
          if (activity.tasks && activity.tasks.length > 0) {
            activity.tasks.forEach((task, taskIndex) => {
              console.log(`    Task ${taskIndex + 1}:`);
              console.log(`      material_unloading: ${task.material_unloading}`);
              console.log(`      material_unloading_hours: ${task.material_unloading_hours}`);
            });
          }
        });
      }
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Material unloading data cleanup completed!');
    console.log('🔌 Disconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMaterialUnloading();
