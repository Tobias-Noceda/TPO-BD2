import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { query1 } from './src/queries/query1.js';

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const mongoClient = new MongoClient('mongodb://mongo:27017');
const DB_NAME = 'ensurances';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
let db;

async function connectDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Query 1: Clientes activos con pólizas vigentes
app.get('/api/clients/active-with-policies', async (req, res) => {
  const results = await query1(mongoClient);
  res.json(results);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📡 Frontend should connect to: http://localhost:${PORT}/api`);
  });
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await mongoClient.close();
  process.exit(0);
});
