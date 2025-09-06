"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const collections_1 = require("../collections");
const decimalUtils_1 = require("../utils/decimalUtils");
require("../config/database");
/**
 * Script to fix existing products in the database that have floating-point precision issues
 * This script will round all monetary fields to 2 decimal places
 */
function fixProductDecimals() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting to fix product decimal precision...');
            // Get all products
            const products = yield collections_1.Product.find({});
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
                const roundedProduct = (0, decimalUtils_1.roundProductDecimals)(product.toObject());
                // Check if any values actually changed
                const hasChanges = originalValues.prezzo_acquisto !== roundedProduct.prezzo_acquisto ||
                    originalValues.utile !== roundedProduct.utile ||
                    originalValues.imponibile !== roundedProduct.imponibile ||
                    originalValues.iva_10 !== roundedProduct.iva_10 ||
                    originalValues.iva_22 !== roundedProduct.iva_22;
                if (hasChanges) {
                    // Update the product
                    yield collections_1.Product.findByIdAndUpdate(product._id, {
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
        }
        catch (error) {
            console.error('Error fixing product decimals:', error);
        }
        finally {
            // Close the database connection
            yield mongoose_1.default.connection.close();
            console.log('Database connection closed');
        }
    });
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
exports.default = fixProductDecimals;
