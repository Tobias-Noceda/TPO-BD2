import express from 'express';
import cors from 'cors';
import { Db, MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { query1 } from './src/queries/query1.js';
import { query11 } from './src/queries/query11.js';
import { query12 } from './src/queries/query12.js';
import { query2 } from './src/queries/query2.js';

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const mongoClient = new MongoClient('mongodb://mongo:27017');
const DB_NAME = 'ensurances';
const cacheTTL = 300; // 5 minutes


// Redis connection
const redisClient = createClient({ url: 'redis://redis:6379' });

// Middleware
app.use(cors());
app.use(express.json());

// Connect to databases
let db;

async function connectDB() {
  try {
    // Connect to MongoDB
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
    
    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Connected to Redis');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Query 1: Clientes activos con pólizas vigentes
app.get('/api/clients/active-with-policies', async (req, res) => {
  try {
    const results = await query1(mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query1:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 2: Siniestros abiertos con tipo, monto y cliente afectado
app.get('/api/claims/open-claims', async (req, res) => {
  try {
    const results = await query2(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query2:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 11: Clientes con más de un vehículo asegurado (Redis)
app.get('/api/clients/multiple-vehicles', async (req, res) => {
  try {
    const results = await query11(redisClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query11:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 12: Agentes y cantidad de siniestros asociados (Redis)
app.get('/api/agents/with-sinisters', async (req, res) => {
  try {
    const results = await query12(redisClient);
    
    // Enrich with agent details from MongoDB
    const agentIds = results.map(r => r.id_agente);
    const agents = await db.collection('agentes').find({ 
      id_agente: { $in: agentIds } 
    }).toArray();
    
    // Create a map for quick lookup
    const agentMap = new Map(agents.map(a => [a.id_agente, a]));
    
    // Merge data
    const enrichedResults = results.map(r => {
      const agent = agentMap.get(r.id_agente);
      return {
        ...r,
        nombre: agent?.nombre || '',
        apellido: agent?.apellido || '',
        matricula: agent?.matricula || '',
        email: agent?.email || '',
        zona: agent?.zona || '',
        activo: agent?.activo || ''
      };
    });
    
    res.json(enrichedResults);
  } catch (error) {
    console.error('Error in query12:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
  await redisClient.quit();
  process.exit(0);
});
