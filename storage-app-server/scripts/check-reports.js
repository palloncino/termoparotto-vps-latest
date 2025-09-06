const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { Report } = require('../dist/collections');

async function checkReports() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    const reports = await Report.find({}).lean();
    
    console.log('📋 REPORTS COLLECTION DETAILS:');
    console.log(`Total reports: ${reports.length}`);
    
    reports.forEach((report, index) => {
      console.log(`\n📄 Report ${index + 1} (${report._id}):`);
      console.log(`  Status: ${report.status}`);
      console.log(`  Activities: ${report.activities?.length || 0}`);
      
      if (report.activities && report.activities.length > 0) {
        report.activities.forEach((activity, actIndex) => {
          console.log(`    Activity ${actIndex + 1}:`);
          console.log(`      Tasks: ${activity.tasks?.length || 0}`);
          
          if (activity.tasks && activity.tasks.length > 0) {
            activity.tasks.forEach((task, taskIndex) => {
              console.log(`        Task ${taskIndex + 1}:`);
              console.log(`          material_unloading: ${task.material_unloading}`);
              console.log(`          material_unloading_hours: ${task.material_unloading_hours}`);
            });
          }
        });
      }
    });
    
    await mongoose.disconnect();
    console.log('✅ MongoDB check completed!');
    console.log('🔌 Disconnected from database');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkReports();
