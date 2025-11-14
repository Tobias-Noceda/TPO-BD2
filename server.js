import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { query1 } from './src/queries/query1.js';
import { query2 } from './src/queries/query2.js';
import { query3 } from './src/queries/query3.js';
import { query4 } from './src/queries/query4.js';
import { query5 } from './src/queries/query5.js';
import { query6 } from './src/queries/query6.js';
import { query7 } from './src/queries/query7.js';
import { query8 } from './src/queries/query8.js';
import { query9 } from './src/queries/query9.js';
import { query10 } from './src/queries/query10.js';
import { query11 } from './src/queries/query11.js';
import { query12 } from './src/queries/query12.js';

import { allClients } from './persistance/allClients.js';
import { query13 } from './src/queries/query13.js';

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

app.get('/api/clients', async (req, res) => {
  try {
    const clients = await allClients(mongoClient);
    res.json(clients);
  } catch (error) {
    console.error('Error fetching all clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Query 3: Vehículos asegurados con cliente y póliza
app.get('/api/clients/insured-vehicles', async (req, res) => {
  try {
    const results = await query3(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query3:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 4: Clientes sin pólizas activas
app.get('/api/clients/without-active-policies', async (req, res) => {
  try {
    const results = await query4(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query4:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 5: Agentes activos con cantidad de pólizas asignadas
app.get('/api/agents/active-with-policies', async (req, res) => {
  try {
    const results = await query5(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query5:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 6: Pólizas vencidas con nombre del cliente
app.get('/api/clients/expired-policies', async (req, res) => {
  try {
    const results = await query6(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query6:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 7: Top 10 clientes por cobertura total
app.get('/api/clients/top-coverage', async (req, res) => {
  try {
    const results = await query7(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query7:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 8: Siniestros tipo "Accidente" del último año
app.get('/api/claims/accidents-last-year', async (req, res) => {
  try {
    const results = await query8(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query8:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 9: Vista de pólizas activas ordenadas por fecha de inicio
app.get('/api/policies/active-ordered', async (req, res) => {
  try {
    const results = await query9(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query9:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 10: Pólizas suspendidas con estado del cliente
app.get('/api/clients/suspended-policies', async (req, res) => {
  try {
    const results = await query10(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query10:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 11: Clientes con más de un vehículo asegurado (Redis)
app.get('/api/clients/multiple-vehicles', async (req, res) => {
  try {
    const results = await query11(redisClient, mongoClient);
    res.json(results);
  } catch (error) {
    console.error('Error in query11:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Query 12: Agentes y cantidad de siniestros asociados (Redis)
app.get('/api/agents/with-sinisters', async (req, res) => {
  try {
    const results = await query12(redisClient, mongoClient);
    
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
