import { faker } from '@faker-js/faker';
import { Client, Product, Report, User, Worksite } from '../collections';
import { roundProductDecimals } from '../utils/decimalUtils';

export async function initDatabase() {
  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Client.deleteMany({}),
    Worksite.deleteMany({}),
    Product.deleteMany({}),
    Report.deleteMany({}),
  ]);

  // Create fake data
  const users = await createUsers(5);
  const clients = await createClients(5);
  const worksites = await createWorksites(2, clients);
  const products = await createProducts(10);
  await createReports(2, users, clients, worksites, products);

  console.log('Database initialized with fake data');
}

async function createUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['admin', 'user']),
      passwordHash: faker.internet.password(),
    });
  }
  return User.create(users);
}

async function createClients(count: number) {
  const clients = [];
  for (let i = 0; i < count; i++) {
    clients.push({
      name: faker.company.name(),
      address: faker.location.streetAddress(),
      contact_info: faker.phone.number(),
    });
  }
  return Client.create(clients);
}

async function createWorksites(count: number, clients: any[]) {
  const worksites = [];
  for (let i = 0; i < count; i++) {
    const client = faker.helpers.arrayElement(clients);
    worksites.push({
      client_id: client._id,
      name: faker.company.name() + ' Site',
      address: faker.location.streetAddress(true),
      description: faker.lorem.sentence(),
      is_active: faker.datatype.boolean(),
      planned_hours: faker.number.int({ min: 10, max: 100 }),
      end_date: faker.date.soon({ days: 30 }), // A future date within the next 30 days
    });
  }
  return Worksite.create(worksites);
}

async function createProducts(count: number) {
  const products = [];
  for (let i = 0; i < count; i++) {
    const prezzo_acquisto = faker.number.float({
      min: 10,
      max: 1000,
      precision: 0.01,
    });
    const utile = faker.number.float({ min: 1, max: 100, precision: 0.01 });
    const imponibile = prezzo_acquisto + utile;
    const iva_10 = imponibile * 0.1;
    const iva_22 = imponibile * 0.22;

    const product = {
      data_documento: faker.date.recent().toISOString().split('T')[0],
      descrizione: faker.commerce.productName(),
      descrizione_interna: faker.commerce.productDescription(),
      fornitore: faker.company.name(),
      prezzo_acquisto,
      utile,
      imponibile,
      iva_10,
      iva_22,
    };
    
    // Round the decimal values
    const roundedProduct = roundProductDecimals(product);
    products.push(roundedProduct);
  }
  return Product.create(products);
}

async function createReports(
  count: number,
  users: any[],
  clients: any[],
  worksites: any[],
  products: any[]
) {
  const reports = [];
  for (let i = 0; i < count; i++) {
    const activityCount = faker.number.int({ min: 1, max: 5 });
    const activities = [];

    for (let j = 0; j < activityCount; j++) {
      // Create tasks for each activity
      const taskCount = faker.number.int({ min: 1, max: 3 });
      const tasks = [];

      for (let k = 0; k < taskCount; k++) {
        const assignedTechnicians = faker.helpers.arrayElements(
          users,
          faker.number.int({ min: 1, max: Math.min(3, users.length) })
        );
        const materialsUsedCount = faker.number.int({ min: 0, max: 5 });
        const usedMaterials = faker.helpers
          .arrayElements(products, materialsUsedCount)
          .map(product => ({
            product_id: product._id,
            quantity: faker.number.int({ min: 1, max: 10 }),
          }));

        tasks.push({
          assigned_technician_ids: assignedTechnicians.map(u => u._id),
          task_description: faker.lorem.sentence(),
          work_hours: faker.number.float({ min: 0.5, max: 8, precision: 0.5 }),
          intervention_type: {
            da_preventivo: faker.datatype.boolean(),
            in_economia: faker.datatype.boolean(),
            sopralluogo: faker.datatype.boolean(),
          },
          materials_used: usedMaterials,
        });
      }

      activities.push({
        client_id: faker.helpers.arrayElement(clients)._id,
        worksite_id: faker.helpers.arrayElement(worksites)._id,
        completed: faker.datatype.boolean(),
        travel_time_hours: faker.number.float({
          min: 0.5,
          max: 3,
          precision: 0.5,
        }),
        valid_travel_time: faker.helpers.arrayElement(['manual', 'rules']),
        intervention_type: {
          da_preventivo: faker.datatype.boolean(),
          in_economia: faker.datatype.boolean(),
          sopralluogo: faker.datatype.boolean(),
        },
        assigned_technician_id: faker.helpers.arrayElement(users)._id,
        tasks,
      });
    }

    reports.push({
      date: faker.date.recent(),
      technician_id: faker.helpers.arrayElement(users)._id,
      lunch_location: faker.location.streetAddress(),
      activities,
    });
  }
  return Report.create(reports);
}
