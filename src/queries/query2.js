import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

export const query2 = async (redisClient, mongoClient) => {
  // Query 2: Siniestros abiertos con tipo, monto y cliente afectado
  // Usamos Redis aca para mejorar el performance cacheando la data
  
  const cacheKey = 'query2:open_claims';
  
  // Primero intentamos en la cache de Redis
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✓ Retrieved from Redis cache');
    return JSON.parse(cached);
  }

  const db = mongoClient.db('ensurances');
  const cacheTTL = 300; // 5 minutes

  // Query MongoDB
  const pipeline = [
    {
        $match: {
          estado: { $in: ['Abierto', 'En proceso'] }
        }
      },
      {
        $lookup: {
          from: 'clientes',
          let: { poliza_num: '$nro_poliza' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$poliza_num', '$polizas.nro_poliza']
                }
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
                ciudad: 1,
                provincia: 1
              }
            }
          ],
          as: 'cliente'
        }
      },
      {
        $unwind: {
          path: '$cliente',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          id_siniestro: 1,
          nro_poliza: 1,
          fecha: 1,
          tipo: 1,
          monto_estimado: 1,
          descripcion: 1,
          estado: 1,
          cliente: 1
        }
      },
      {
        $sort: { fecha: -1 }
      }
  ];
  
  const results = await db.collection('siniestros').aggregate(pipeline).toArray();
  
  // Cache in Redis
  await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));

  return results;
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  
  try {
    await redisClient.connect();
    console.log('=== QUERY 2: Siniestros abiertos con tipo, monto y cliente afectado ===\n');
    
    const results = await query2(redisClient);
    console.log(`Total de siniestros abiertos: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 2:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
  }
}
