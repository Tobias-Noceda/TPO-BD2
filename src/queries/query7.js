import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const PIPELINE = [
  { $unwind: '$polizas' },
  {
    $group: {
      _id: {
        id_cliente: '$id_cliente',
        nombre: '$nombre',
        apellido: '$apellido'
      },
      total_cobertura: { $sum: '$polizas.cobertura_total' }
    }
  },
  { $sort: { total_cobertura: -1 } },
  { $limit: 10 },
  {
    $project: {
      _id: 0,
      id_cliente: '$_id.id_cliente',
      nombre: '$_id.nombre',
      apellido: '$_id.apellido',
      total_cobertura: 1
    }
  }
];

export const query7 = async (redisClient, mongoClient) => {
  const cacheKey = 'query7:top10_coverage';
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
    console.log('=== QUERY 7: Top 10 clientes con mayor cobertura total ===');

    const results = await query7(redisClient, mongoClient);
    console.log(`Top 10 clientes por cobertura total: ${results.length}`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 7:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}
