"use strict";
/**
 * Utility functions for handling decimal precision in monetary values
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToTwoDecimals = roundToTwoDecimals;
exports.roundProductDecimals = roundProductDecimals;
exports.roundProductsDecimals = roundProductsDecimals;
/**
 * Rounds a number to 2 decimal places to avoid floating-point precision issues
 * @param value - The number to round
 * @returns The rounded number
 */
function roundToTwoDecimals(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
/**
 * Processes a product object and rounds all monetary fields to 2 decimal places
 * @param product - The product object to process
 * @returns The product object with rounded monetary values
 */
function roundProductDecimals(product) {
    const monetaryFields = [
        'prezzo_acquisto',
        'utile',
        'imponibile',
        'iva_10',
        'iva_22'
    ];
    const processedProduct = Object.assign({}, product);
    monetaryFields.forEach(field => {
        // Handle both string and number inputs
        if (processedProduct[field] !== undefined && processedProduct[field] !== null) {
            const value = typeof processedProduct[field] === 'string'
                ? parseFloat(processedProduct[field])
                : processedProduct[field];
            if (!isNaN(value)) {
                processedProduct[field] = roundToTwoDecimals(value);
            }
        }
    });
    return processedProduct;
}
/**
 * Processes an array of products and rounds all monetary fields
 * @param products - Array of product objects
 * @returns Array of products with rounded monetary values
 */
function roundProductsDecimals(products) {
    return products.map(product => roundProductDecimals(product));
}
