import mongoose from 'mongoose';
import { Product } from '../collections';
import { roundProductDecimals } from '../utils/decimalUtils';
import '../config/database';

/**
 * Script to fix existing products in the database that have floating-point precision issues
 * This script will round all monetary fields to 2 decimal places
 */
async function fixProductDecimals() {
  try {
    console.log('Starting to fix product decimal precision...');
    
    // Get all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to process`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      const originalValues = {
        prezzo_acquisto: product.prezzo_acquisto,
        utile: product.utile,
        imponibile: product.imponibile,
        iva_10: product.iva_10,
        iva_22: product.iva_22
      };
      
      // Round the values
      const roundedProduct = roundProductDecimals(product.toObject());
      
      // Check if any values actually changed
      const hasChanges = 
        originalValues.prezzo_acquisto !== roundedProduct.prezzo_acquisto ||
        originalValues.utile !== roundedProduct.utile ||
        originalValues.imponibile !== roundedProduct.imponibile ||
        originalValues.iva_10 !== roundedProduct.iva_10 ||
        originalValues.iva_22 !== roundedProduct.iva_22;
      
      if (hasChanges) {
        // Update the product
        await Product.findByIdAndUpdate(product._id, {
          prezzo_acquisto: roundedProduct.prezzo_acquisto,
          utile: roundedProduct.utile,
          imponibile: roundedProduct.imponibile,
          iva_10: roundedProduct.iva_10,
          iva_22: roundedProduct.iva_22
        });
        
        updatedCount++;
        console.log(`Updated product: ${product.descrizione} (ID: ${product._id})`);
        console.log(`  Before: ${JSON.stringify(originalValues)}`);
        console.log(`  After: ${JSON.stringify({
          prezzo_acquisto: roundedProduct.prezzo_acquisto,
          utile: roundedProduct.utile,
          imponibile: roundedProduct.imponibile,
          iva_10: roundedProduct.iva_10,
          iva_22: roundedProduct.iva_22
        })}`);
      }
    }
    
    console.log(`\n✅ Completed! Updated ${updatedCount} out of ${products.length} products`);
    
  } catch (error) {
    console.error('Error fixing product decimals:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  fixProductDecimals()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default fixProductDecimals; 