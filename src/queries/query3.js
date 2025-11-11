import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 3: Vehículos asegurados con cliente y póliza ===\n');

  const pipeline = [
    {
      // Pre-filtro: clientes con vehículos asegurados Y pólizas Auto activas
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
    {
      $unwind: "$vehiculos"
    },
    {
      // Filtrar solo vehículos asegurados
      $match: {
        "vehiculos.asegurado": "True"
      }
    },
    {
      $addFields: {
        // Encontrar la primera póliza Auto activa (asumiendo 1:1)
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
      // Solo resultados con póliza encontrada
      $match: {
        poliza_auto: { $ne: null }
      }
    },
    {
      $project: {
        _id: 0,
        // Datos del cliente tal cual están
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
        // Datos del vehículo tal cual están
        vehiculo: "$vehiculos",
        // Datos de la póliza tal cual están
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

