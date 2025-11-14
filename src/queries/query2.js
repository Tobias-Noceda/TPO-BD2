import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const PIPELINE = [
  { $match: { estado: 'Abierto' } },
  {
    $lookup: {
      from: 'clientes',
      let: { nro_poliza: '$nro_poliza' },
      pipeline: [
        {
          $match: { $expr: { $in: ['$$nro_poliza', '$polizas.nro_poliza'] } }
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
            ciudad: 1,
            provincia: 1
          }
        }
      ],
      as: 'cliente'
    }
  },
  { $unwind: '$cliente' },
  {
    $project: {
      _id: 0,
      id_siniestro: 1,
      nro_poliza: 1,
      tipo: 1,
      monto_estimado: 1,
      estado: 1,
      cliente: '$cliente'
    }
  },
  { $sort: { monto_estimado: -1 } }
];

export const query2 = async (redisClient, mongoClient) => {
  const cacheKey = 'query2:open_claims';
  const cacheTTL = 300; // 5 minutos

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✓ Retrieved from Redis cache');
    return JSON.parse(cached);
  }

  const db = mongoClient.db('ensurances');
  const results = await db.collection('siniestros').aggregate(PIPELINE).toArray();

  await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));

  return results;
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  const mongoClient = new MongoClient('mongodb://mongo:27017');

  try {
    await redisClient.connect();
    await mongoClient.connect();
    console.log('=== QUERY 2: Siniestros abiertos con datos del cliente ===\n');

    const results = await query2(redisClient, mongoClient);
    console.log(`Total de siniestros abiertos: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 2:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}
