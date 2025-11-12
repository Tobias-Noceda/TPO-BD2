import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

export const query11 = async (redisClient, mongoClient) => {
  // Query 11: Clientes con más de un vehículo asegurado
  // Primero intenta Redis, si está vacío usa MongoDB y popula Redis
  
  const cacheKey = 'clients_multi_vehicle';
  
  // Intentar obtener de Redis
  const allClients = await redisClient.hGetAll(cacheKey);
  
  // Si Redis tiene datos, devolverlos
  if (Object.keys(allClients).length > 0) {
    console.log('✓ Retrieved from Redis cache');
    const results = Object.entries(allClients).map(([clientId, clientDataJson]) => {
      const clientData = JSON.parse(clientDataJson);
      return {
        ...clientData,
        id_cliente: parseInt(clientId, 10)
      };
    });
    return results;
  }
  
  // Si Redis está vacío, consultar MongoDB
  console.log('✓ Cache miss, querying MongoDB and populating Redis');
  const db = mongoClient.db('ensurances');
  
  const pipeline = [
    {
      $match: {
        'vehiculos.1': { $exists: true } // Tiene al menos 2 vehículos
      }
    },
    {
      $project: {
        _id: 0,
        id_cliente: 1,
        nombre: 1,
        apellido: 1,
        dni: 1,
        email: 1,
        telefono: 1,
        direccion: 1,
        ciudad: 1,
        provincia: 1,
        activo: 1
      }
    }
  ];
  
  const results = await db.collection('clientes').aggregate(pipeline).toArray();
  
  // Poblar Redis para futuras consultas
  if (results.length > 0) {
    for (const client of results) {
      const clientId = client.id_cliente.toString();
      const clientData = { ...client };
      delete clientData.id_cliente; // No duplicar el ID en el JSON
      await redisClient.hSet(cacheKey, clientId, JSON.stringify(clientData));
    }
    console.log(`✓ Populated Redis with ${results.length} clients`);
  }
  
  return results;
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  const mongoClient = new MongoClient('mongodb://mongo:27017');
  
  try {
    await redisClient.connect();
    await mongoClient.connect();
    console.log('=== QUERY 11: Clientes con más de un vehículo asegurado ===\n');
    
    const results = await query11(redisClient, mongoClient);
    console.log(`Total de clientes con múltiples vehículos: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 11:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}
