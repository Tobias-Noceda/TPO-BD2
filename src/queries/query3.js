import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const PIPELINE = [
  {
    $match: {
      'vehiculos.asegurado': 'True',
      polizas: {
        $elemMatch: {
          tipo: 'Auto',
          estado: 'Activa'
        }
      }
    }
  },
  { $unwind: '$vehiculos' },
  {
    $match: { 'vehiculos.asegurado': 'True' }
  },
  {
    $addFields: {
      poliza_auto: {
        $first: {
          $filter: {
            input: '$polizas',
            as: 'p',
            cond: {
              $and: [
                { $eq: ['$$p.tipo', 'Auto'] },
                { $eq: ['$$p.estado', 'Activa'] }
              ]
            }
          }
        }
      }
    }
  },
  {
    $match: {
      poliza_auto: { $ne: null }
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
      activo: 1,
      vehiculo: '$vehiculos',
      poliza: '$poliza_auto'
    }
  }
];

export const query3 = async (redisClient, mongoClient) => {
  const cacheKey = 'query3:insured-vehicles';
  const cacheTTL = 300;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✓ Retrieved from Redis cache');
    return JSON.parse(cached);
  }

  const db = mongoClient.db('ensurances');
  const results = await db.collection('clientes').aggregate(PIPELINE).toArray();

  await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));
  return results;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  const mongoClient = new MongoClient('mongodb://mongo:27017');

  try {
    await redisClient.connect();
    await mongoClient.connect();
    console.log('=== QUERY 3: Vehículos asegurados con cliente y póliza ===');

    const results = await query3(redisClient, mongoClient);
    console.log(`Total de vehículos asegurados con póliza: ${results.length}`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 3:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

