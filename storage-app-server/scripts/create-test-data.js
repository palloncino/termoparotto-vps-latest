#!/usr/bin/env node

/**
 * Create Test Data Script
 * Adds sample data to test our new schema fields
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User, Product, Client, Worksite } = require('../dist/collections');

async function createTestData() {
    try {
        console.log('🚀 Creating test data to verify schema changes...');

        // Connect to database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/termoparotto';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database');

        // 1. Create test users with hourly_cost
        console.log('\n👥 Creating test users...');
        const users = [
            {
                name: 'Admin User',
                email: 'admin@termoparotto.com',
                role: 'admin',
                passwordHash: 'admin-hash',
                hourly_cost: 35.00,
                is_active: true,
                status: 'approved'
            },
            {
                name: 'Technician One',
                email: 'tech1@termoparotto.com',
                role: 'user',
                passwordHash: 'tech1-hash',
                hourly_cost: 28.50,
                is_active: true,
                status: 'approved'
            },
            {
                name: 'Technician Two',
                email: 'tech2@termoparotto.com',
                role: 'user',
                passwordHash: 'tech2-hash',
                hourly_cost: 32.75,
                is_active: true,
                status: 'approved'
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`✅ Created ${createdUsers.length} users`);
        createdUsers.forEach(user => {
            console.log(`   - ${user.name}: €${user.hourly_cost}/hour`);
        });

        // 2. Create test clients
        console.log('\n🏢 Creating test clients...');
        const clients = [
            {
                name: 'Client Alpha',
                address: 'Via Roma 123, Milano',
                contact_info: 'info@alpha.com'
            },
            {
                name: 'Client Beta',
                address: 'Via Milano 456, Roma',
                contact_info: 'info@beta.com'
            }
        ];

        const createdClients = await Client.insertMany(clients);
        console.log(`✅ Created ${createdClients.length} clients`);

        // 3. Create test worksites
        console.log('\n🏗️ Creating test worksites...');
        const worksites = [
            {
                client_id: createdClients[0]._id,
                name: 'Worksite Alpha A',
                address: 'Via Roma 123, Milano',
                description: 'Main construction site',
                is_active: true,
                planned_hours: 120
            },
            {
                client_id: createdClients[1]._id,
                name: 'Worksite Beta B',
                address: 'Via Milano 456, Roma',
                description: 'Renovation project',
                is_active: true,
                planned_hours: 80
            }
        ];

        const createdWorksites = await Worksite.insertMany(worksites);
        console.log(`✅ Created ${createdWorksites.length} worksites`);

        // 4. Create test products with unit_of_measure
        console.log('\n📦 Creating test products...');
        const products = [
            {
                data_documento: 'PROD-001',
                descrizione: 'Cemento Portland',
                descrizione_interna: 'Cemento grigio',
                fornitore: 'Fornitore Cemento',
                unit_of_measure: 'kg',
                prezzo_acquisto: 0.85,
                utile: 0.15,
                imponibile: 1.00,
                iva_10: 0.10,
                iva_22: 0.00
            },
            {
                data_documento: 'PROD-002',
                descrizione: 'Tubi PVC 100mm',
                descrizione_interna: 'Tubi grigi',
                fornitore: 'Fornitore Tubi',
                unit_of_measure: 'm',
                prezzo_acquisto: 12.50,
                utile: 2.50,
                imponibile: 15.00,
                iva_10: 0.00,
                iva_22: 3.30
            },
            {
                data_documento: 'PROD-003',
                descrizione: 'Viti 6x100',
                descrizione_interna: 'Viti zincate',
                fornitore: 'Fornitore Viti',
                unit_of_measure: 'pz',
                prezzo_acquisto: 0.45,
                utile: 0.05,
                imponibile: 0.50,
                iva_10: 0.00,
                iva_22: 0.11
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log(`✅ Created ${createdProducts.length} products`);
        createdProducts.forEach(product => {
            console.log(`   - ${product.descrizione}: ${product.unit_of_measure}`);
        });

        // 5. Verify the data
        console.log('\n🔍 Verifying created data...');

        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const clientCount = await Client.countDocuments();
        const worksiteCount = await Worksite.countDocuments();

        console.log('📊 Database Summary:');
        console.log(`   - Users: ${userCount}`);
        console.log(`   - Products: ${productCount}`);
        console.log(`   - Clients: ${clientCount}`);
        console.log(`   - Worksites: ${worksiteCount}`);

        // 6. Test queries with new fields
        console.log('\n🧪 Testing queries with new fields...');

        const usersWithHourlyCost = await User.find({ hourly_cost: { $gt: 30 } });
        console.log(`Users with hourly cost > €30: ${usersWithHourlyCost.length}`);

        const productsByUnit = await Product.find({ unit_of_measure: 'kg' });
        console.log(`Products measured in kg: ${productsByUnit.length}`);

        console.log('\n✅ Test data creation completed successfully!');
        console.log('💡 You can now run "npm run check:db" to see the full data structure');

    } catch (error) {
        console.error('❌ Test data creation failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

// Run if called directly
if (require.main === module) {
    createTestData();
}

module.exports = { createTestData };
