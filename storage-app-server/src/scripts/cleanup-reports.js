const mongoose = require('mongoose');
const Report = require('../models/Report');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/termoparotto', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function cleanupReports() {
  try {
    console.log('🔍 Starting report cleanup...');
    
    // Find all reports
    const reports = await Report.find({});
    console.log(`📊 Found ${reports.length} reports to check`);
    
    let cleanedCount = 0;
    let totalMaterialsRemoved = 0;
    
    for (const report of reports) {
      let reportModified = false;
      
      // Check each activity and task
      for (const activity of report.activities) {
        for (const task of activity.tasks) {
          if (task.materials_used && task.materials_used.length > 0) {
            const originalCount = task.materials_used.length;
            
            // Filter out materials with invalid product_id
            task.materials_used = task.materials_used.filter(
              material => material.product_id && 
                         material.product_id.toString().trim() !== '' && 
                         material.product_id !== null
            );
            
            const newCount = task.materials_used.length;
            if (newCount !== originalCount) {
              const removed = originalCount - newCount;
              totalMaterialsRemoved += removed;
              reportModified = true;
              console.log(`  📦 Report ${report._id}: Removed ${removed} invalid materials from task`);
            }
          }
        }
      }
      
      // Save the cleaned report if modified
      if (reportModified) {
        await report.save();
        cleanedCount++;
      }
    }
    
    console.log(`✅ Cleanup completed!`);
    console.log(`📝 Reports cleaned: ${cleanedCount}`);
    console.log(`🗑️  Total invalid materials removed: ${totalMaterialsRemoved}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the cleanup
cleanupReports();
