import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

export const query12 = async (_redisClient, mongoClient) => {
  // Query 12: Agentes y cantidad de siniestros asociados (solo Mongo por ahora)
  const db = mongoClient.db('ensurances');

  const pipeline = [
    { $unwind: '$polizas' },
    {
      $lookup: {
        from: 'siniestros',
        localField: 'polizas.nro_poliza',
        foreignField: 'nro_poliza',
        as: 'siniestros_poliza'
      }
    },
    {
      $addFields: {
        siniestros_count: { $size: '$siniestros_poliza' }
      }
    },
    {
      $group: {
        _id: '$polizas.id_agente',
        cantidad_siniestros: { $sum: '$siniestros_count' },
        cantidad_polizas: { $sum: 1 }
      }
    },
    { $match: { _id: { $ne: null } } },
    {
      $lookup: {
        from: 'agentes',
        localField: '_id',
        foreignField: 'id_agente',
        as: 'agente'
      }
    },
    { $unwind: '$agente' },
    {
      $project: {
        _id: 0,
        id_agente: '$_id',
        nombre: '$agente.nombre',
        apellido: '$agente.apellido',
        matricula: '$agente.matricula',
        email: '$agente.email',
        telefono: '$agente.telefono',
        zona: '$agente.zona',
        activo: '$agente.activo',
        cantidad_siniestros: 1,
        cantidad_polizas: 1
      }
    },
    { $sort: { cantidad_siniestros: -1, cantidad_polizas: -1 } }
  ];

  return db.collection('clientes').aggregate(pipeline).toArray();
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  const mongoClient = new MongoClient('mongodb://mongo:27017');
  
  try {
    await redisClient.connect();
    await mongoClient.connect();
    console.log('=== QUERY 12: Agentes y cantidad de siniestros asociados ===\n');
    
    const results = await query12(redisClient, mongoClient);
    console.log(`Total de agentes con siniestros: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 12:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}
