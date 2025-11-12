import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 3: Vehículos asegurados con cliente y póliza ===\n');

  const pipeline = [
    {
      $match: {
        "vehiculos.asegurado": "True",
        "polizas": {
          $elemMatch: {
            tipo: "Auto",
            estado: "Activa"
          }
        }
      }
    },
    {$unwind: "$vehiculos"},
    {
      $match: {"vehiculos.asegurado": "True"}
    },
    {
      $addFields: {
        poliza_auto: {
          $first: {
            $filter: {
              input: "$polizas",
              as: "p",
              cond: {
                $and: [
                  { $eq: ["$$p.tipo", "Auto"] },
                  { $eq: ["$$p.estado", "Activa"] }
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
        vehiculo: "$vehiculos",
        poliza: "$poliza_auto"
      }
    }
  ];

  const results = await db.collection('clientes').aggregate(pipeline).toArray();

  console.log(`Total de vehículos asegurados con póliza: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 3:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}

