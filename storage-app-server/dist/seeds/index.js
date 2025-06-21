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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const faker_1 = require("@faker-js/faker");
const collections_1 = require("../collections");
function initDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        // Clear existing data
        yield Promise.all([
            collections_1.User.deleteMany({}),
            collections_1.Client.deleteMany({}),
            collections_1.Worksite.deleteMany({}),
            collections_1.Product.deleteMany({}),
            collections_1.Report.deleteMany({})
        ]);
        // Create fake data
        const users = yield createUsers(5);
        const clients = yield createClients(5);
        const worksites = yield createWorksites(2, clients);
        const products = yield createProducts(10);
        yield createReports(2, users, clients, worksites, products);
        console.log('Database initialized with fake data');
    });
}
function createUsers(count) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = [];
        for (let i = 0; i < count; i++) {
            users.push({
                name: faker_1.faker.person.fullName(),
                email: faker_1.faker.internet.email(),
                role: faker_1.faker.helpers.arrayElement(['admin', 'user']),
                passwordHash: faker_1.faker.internet.password()
            });
        }
        return collections_1.User.create(users);
    });
}
function createClients(count) {
    return __awaiter(this, void 0, void 0, function* () {
        const clients = [];
        for (let i = 0; i < count; i++) {
            clients.push({
                name: faker_1.faker.company.name(),
                address: faker_1.faker.location.streetAddress(),
                contact_info: faker_1.faker.phone.number()
            });
        }
        return collections_1.Client.create(clients);
    });
}
function createWorksites(count, clients) {
    return __awaiter(this, void 0, void 0, function* () {
        const worksites = [];
        for (let i = 0; i < count; i++) {
            const client = faker_1.faker.helpers.arrayElement(clients);
            worksites.push({
                client_id: client._id,
                name: faker_1.faker.company.name() + ' Site',
                address: faker_1.faker.location.streetAddress(true),
                description: faker_1.faker.lorem.sentence(),
                is_active: faker_1.faker.datatype.boolean(),
                planned_hours: faker_1.faker.number.int({ min: 10, max: 100 }),
                end_date: faker_1.faker.date.soon({ days: 30 }) // A future date within the next 30 days
            });
        }
        return collections_1.Worksite.create(worksites);
    });
}
function createProducts(count) {
    return __awaiter(this, void 0, void 0, function* () {
        const products = [];
        for (let i = 0; i < count; i++) {
            const unit_price_list = faker_1.faker.number.float({ min: 10, max: 1000, precision: 0.01 });
            const unit_price_first_discount = faker_1.faker.number.float({ min: 0, max: 0.5, precision: 0.01 });
            const unit_price_net = unit_price_list * (1 - unit_price_first_discount);
            const unit_price_markup = faker_1.faker.number.float({ min: 0.1, max: 0.5, precision: 0.01 });
            const unit_price_taxable = unit_price_net * (1 + unit_price_markup);
            const unit_price_sale = unit_price_taxable;
            products.push({
                item_code: faker_1.faker.string.alphanumeric(10),
                supplier_item_code: faker_1.faker.string.alphanumeric(10),
                item_description: faker_1.faker.commerce.productDescription(),
                diameter: faker_1.faker.number.float({ min: 1, max: 100, precision: 0.1 }),
                length_mm: faker_1.faker.number.int({ min: 100, max: 10000 }),
                unit_price_list,
                unit_price_first_discount,
                unit_price_net,
                unit_price_markup,
                unit_price_taxable,
                unit_price_sale,
                type: faker_1.faker.helpers.arrayElement(['product', 'material'])
            });
        }
        return collections_1.Product.create(products);
    });
}
function createReports(count, users, clients, worksites, products) {
    return __awaiter(this, void 0, void 0, function* () {
        const reports = [];
        for (let i = 0; i < count; i++) {
            const activityCount = faker_1.faker.number.int({ min: 1, max: 5 });
            const activities = [];
            for (let j = 0; j < activityCount; j++) {
                // Create tasks for each activity
                const taskCount = faker_1.faker.number.int({ min: 1, max: 3 });
                const tasks = [];
                for (let k = 0; k < taskCount; k++) {
                    const assignedTechnicians = faker_1.faker.helpers.arrayElements(users, faker_1.faker.number.int({ min: 1, max: Math.min(3, users.length) }));
                    const materialsUsedCount = faker_1.faker.number.int({ min: 0, max: 5 });
                    const usedMaterials = faker_1.faker.helpers.arrayElements(products, materialsUsedCount).map(product => ({
                        product_id: product._id,
                        quantity: faker_1.faker.number.int({ min: 1, max: 10 })
                    }));
                    tasks.push({
                        assigned_technician_ids: assignedTechnicians.map(u => u._id),
                        task_description: faker_1.faker.lorem.sentence(),
                        work_hours: faker_1.faker.number.float({ min: 0.5, max: 8, precision: 0.5 }),
                        intervention_type: {
                            to_quote: faker_1.faker.datatype.boolean(),
                            in_economy: faker_1.faker.datatype.boolean(),
                            site_inspection: faker_1.faker.datatype.boolean()
                        },
                        materials_used: usedMaterials
                    });
                }
                activities.push({
                    client_id: faker_1.faker.helpers.arrayElement(clients)._id,
                    worksite_id: faker_1.faker.helpers.arrayElement(worksites)._id,
                    activity_description: faker_1.faker.lorem.sentence(),
                    completed: faker_1.faker.datatype.boolean(),
                    travel_time_hours: faker_1.faker.number.float({ min: 0.5, max: 3, precision: 0.5 }),
                    valid_travel_time: faker_1.faker.helpers.arrayElement(['manual', 'rules']),
                    intervention_type: {
                        to_quote: faker_1.faker.datatype.boolean(),
                        in_economy: faker_1.faker.datatype.boolean(),
                        site_inspection: faker_1.faker.datatype.boolean()
                    },
                    assigned_technician_id: faker_1.faker.helpers.arrayElement(users)._id,
                    tasks
                });
            }
            reports.push({
                date: faker_1.faker.date.recent(),
                technician_id: faker_1.faker.helpers.arrayElement(users)._id,
                lunch_location: faker_1.faker.location.streetAddress(),
                short_description: faker_1.faker.lorem.sentence(),
                activities
            });
        }
        return collections_1.Report.create(reports);
    });
}
