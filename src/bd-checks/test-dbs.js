// test-dbs.js
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

// MongoDB
const mongoClient = new MongoClient('mongodb://mongo:27017');
await mongoClient.connect();
const db = mongoClient.db('ensurances');
const clientsCount = await db.collection('clientes').countDocuments();
console.log(`Clientes: ${clientsCount}`);
const firstClient = await db.collection('clientes').findOne();
console.log('First client:', firstClient);

// Redis
const redisClient = createClient({ url: 'redis://redis:6379' });
await redisClient.connect();
const multiVehicle = await redisClient.hGetAll('clients_multi_vehicle');
console.log('Clients with multiple vehicles:', multiVehicle);

await mongoClient.close();
await redisClient.quit();