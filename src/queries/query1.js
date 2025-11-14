import { MongoClient } from 'mongodb';

export const query1 = async (client) => {
  await client.connect();
  const db = client.db('ensurances');

  const pipeline = [
    {
      $match: {
        activo: "True",
        "polizas.estado": "Activa"  // Pre-filtro: solo docs con al menos 1 póliza activa
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
        polizas_vigentes: {
          $filter: {
            input: "$polizas",
            as: "p",
            cond: {
              $eq: ["$$p.estado", "Activa"]
            }
          }
        }
      }
    },
    {
      // Solo devolver clientes que realmente tienen pólizas vigentes
      $match: {
        "polizas_vigentes.0": { $exists: true }
      }
    }
  ];

  return await db.collection('clientes').aggregate(pipeline).toArray();
}

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoClient = new MongoClient('mongodb://mongo:27017');

  try {
    console.log('=== QUERY 1: Clientes activos con pólizas vigentes ===\n');

    const results = await query1(mongoClient);
    console.log(`Total de clientes activos con pólizas vigentes: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 1:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
  }
}