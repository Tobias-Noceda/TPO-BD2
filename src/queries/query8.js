import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

export const query8 = async (redisClient, mongoClient) => {
  const cacheKey = 'query8:accidents-last-year';
  const cacheTTL = 300;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✓ Retrieved from Redis cache');
    return JSON.parse(cached);
  }

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const pipeline = [
    {
      $addFields: {
        fecha_date: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: [{ $arrayElemAt: [{ $split: ['$fecha', '/'] }, 2] }, 0, 4] },
                '-',
                { $substr: [{ $arrayElemAt: [{ $split: ['$fecha', '/'] }, 1] }, 0, 2] },
                '-',
                { $substr: [{ $arrayElemAt: [{ $split: ['$fecha', '/'] }, 0] }, 0, 2] }
              ]
            },
            format: '%Y-%m-%d'
          }
        }
      }
    },
    {
      $match: {
        tipo: 'Accidente',
        fecha_date: {
          $gte: oneYearAgo,
          $lte: today
        }
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
              direccion: 1,
              ciudad: 1,
              provincia: 1,
              activo: 1
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
    { $sort: { fecha_date: -1 } },
    { $project: { fecha_date: 0 } }
  ];

  const db = mongoClient.db('ensurances');
  const results = await db.collection('siniestros').aggregate(pipeline).toArray();

  await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));
  return results;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  const mongoClient = new MongoClient('mongodb://mongo:27017');

  try {
    await redisClient.connect();
    await mongoClient.connect();
    console.log('=== QUERY 8: Siniestros tipo "Accidente" del último año ===');

    const results = await query8(redisClient, mongoClient);
    console.log(`Total de siniestros tipo "Accidente" del último año: ${results.length}`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 8:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

