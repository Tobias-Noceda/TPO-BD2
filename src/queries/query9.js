import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const PIPELINE = [
  { $unwind: '$polizas' },
  { $match: { 'polizas.estado': 'Activa' } },
  { $replaceRoot: { newRoot: '$polizas' } },
  {
    $addFields: {
      fecha_inicio_date_format: {
        $dateFromString: {
          dateString: '$fecha_inicio',
          format: '%d/%m/%Y'
        }
      }
    }
  },
  { $sort: { fecha_inicio_date_format: 1 } },
  {
    $project: {
      _id: 0,
      fecha_inicio_date_format: 0
    }
  }
];

export const query9 = async (redisClient, mongoClient) => {
  const cacheKey = 'query9:active-policies-view';
  const cacheTTL = 300;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✓ Retrieved from Redis cache');
    return JSON.parse(cached);
  }

  const db = mongoClient.db('ensurances');

  const existing = await db.listCollections({ name: 'poliza_fecha_ini' }).toArray();
  if (existing.length === 0) {
    await db.createCollection('poliza_fecha_ini', { viewOn: 'clientes', pipeline: PIPELINE });
    console.log('View `poliza_fecha_ini` creada.');
  } else {
    console.log('View `poliza_fecha_ini` ya existe.');
  }

  const results = await db.collection('poliza_fecha_ini').find().toArray();

  await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));
  return results;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  const mongoClient = new MongoClient('mongodb://mongo:27017');

  try {
    await redisClient.connect();
    await mongoClient.connect();
    console.log('=== QUERY 9: Vista de pólizas activas ordenadas por fecha de inicio ===');

    const results = await query9(redisClient, mongoClient);
    console.log(`Total de Pólizas activas ordenadas por fecha de inicio: ${results.length}`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 9:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

