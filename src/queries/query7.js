import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 7: Top 10 clientes con mayor cobertura total ===\n');

  const pipeline = [
    {$unwind: "$polizas"},
    {
      $group: {
        _id: {
          id_cliente: "$id_cliente",
          nombre: "$nombre",
          apellido: "$apellido"
        },
        total_cobertura: { $sum: "$polizas.cobertura_total" }
      }
    },
    {$sort: { total_cobertura: -1 }},
    {$limit: 10},
    {
      $project: {
        _id: 0,
        id_cliente: "$_id.id_cliente",
        nombre: "$_id.nombre",
        apellido: "$_id.apellido",
        total_cobertura: 1
      }
    }
  ];

  const results = await db.collection('clientes').aggregate(pipeline).toArray();

  console.log(`Top 10 clientes por cobertura total: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 7:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}
