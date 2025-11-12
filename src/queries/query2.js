import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 2: Siniestros abiertos con datos del cliente ===\n');

  const pipeline = [
    {$match: { estado: "Abierto" }},
    {
      $lookup: {
        from: "clientes",
        let: { nro_poliza: "$nro_poliza" },
        pipeline: [
          {
            $match: {$expr: { $in: ["$$nro_poliza", "$polizas.nro_poliza"] }}
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
        as: "cliente"
      }
    },
    { $unwind: "$cliente" },
    {
      $project: {
        _id: 0,
        id_siniestro: 1,
        nro_poliza: 1,
        tipo: 1,
        monto_estimado: 1,
        estado: 1,
        cliente: "$cliente"
      }
    },
    {
      $sort: { monto_estimado: -1 }
    }
  ];

  const results = await db.collection('siniestros').aggregate(pipeline).toArray();

  console.log(`Total de siniestros abiertos: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 2:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}
