import { createClient } from 'redis';
import { MongoClient } from 'mongodb';

export const query12 = async (redisClient, mongoClient) => {
  // Query 12: Agentes y cantidad de siniestros asociados
  // Primero intenta Redis, si está vacío usa MongoDB y popula Redis
  
  const sinistersKey = 'agents_sinisters';
  const policiesKey = 'agents_policies';
  
  // Intentar obtener de Redis
  const agentsSinisters = await redisClient.hGetAll(sinistersKey);
  const agentsPolicies = await redisClient.hGetAll(policiesKey);
  
  // Si Redis tiene datos, devolverlos
  if (Object.keys(agentsSinisters).length > 0) {
    console.log('✓ Retrieved from Redis cache');
    const results = Object.entries(agentsSinisters).map(([agentId, sinisterCount]) => {
      return {
        id_agente: parseInt(agentId, 10),
        cantidad_siniestros: parseInt(sinisterCount, 10),
        cantidad_polizas: parseInt(agentsPolicies[agentId] || 0, 10)
      };
    });
    results.sort((a, b) => b.cantidad_siniestros - a.cantidad_siniestros);
    return results;
  }
  
  // Si Redis está vacío, consultar MongoDB
  console.log('✓ Cache miss, querying MongoDB and populating Redis');
  const db = mongoClient.db('ensurances');
  
  // Primero obtener todos los agentes
  const agentes = await db.collection('agentes').find({}, { projection: { id_agente: 1 } }).toArray();
  const agentIds = agentes.map(a => a.id_agente);
  
  // Contar pólizas por agente
  const policiesPipeline = [
    {
      $group: {
        _id: '$id_agente',
        count: { $sum: 1 }
      }
    }
  ];
  const policiesCount = await db.collection('clientes').aggregate([
    { $unwind: '$polizas' },
    { $group: { _id: '$polizas.id_agente', count: { $sum: 1 } } }
  ]).toArray();
  
  // Contar siniestros por agente (a través de pólizas)
  const sinistersPipeline = [
    {
      $lookup: {
        from: 'clientes',
        let: { poliza_num: '$nro_poliza' },
        pipeline: [
          { $unwind: '$polizas' },
          {
            $match: {
              $expr: { $eq: ['$polizas.nro_poliza', '$$poliza_num'] }
            }
          },
          { $project: { id_agente: '$polizas.id_agente' } }
        ],
        as: 'poliza_info'
      }
    },
    { $unwind: { path: '$poliza_info', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: '$poliza_info.id_agente',
        count: { $sum: 1 }
      }
    }
  ];
  const sinistersCount = await db.collection('siniestros').aggregate(sinistersPipeline).toArray();
  
  // Crear mapas para lookup rápido
  const policiesMap = new Map(policiesCount.map(p => [p._id, p.count]));
  const sinistersMap = new Map(sinistersCount.map(s => [s._id, s.count]));
  
  // Construir resultados y poblar Redis
  const results = agentIds.map(agentId => {
    const sinisterCount = sinistersMap.get(agentId) || 0;
    const policyCount = policiesMap.get(agentId) || 0;
    
    // Poblar Redis
    redisClient.hSet(sinistersKey, agentId.toString(), sinisterCount.toString());
    redisClient.hSet(policiesKey, agentId.toString(), policyCount.toString());
    
    return {
      id_agente: agentId,
      cantidad_siniestros: sinisterCount,
      cantidad_polizas: policyCount
    };
  });
  
  results.sort((a, b) => b.cantidad_siniestros - a.cantidad_siniestros);
  
  console.log(`✓ Populated Redis with ${results.length} agents`);
  
  return results;
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
