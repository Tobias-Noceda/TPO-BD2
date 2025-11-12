import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 9: Vista de pólizas activas ordenadas por fecha de inicio ===\n');

  const pipeline = [
  { $unwind: "$polizas" },
  { $match: { "polizas.estado": "Activa" } },
  { $replaceRoot: { newRoot: "$polizas" } },
  {
    $addFields: {
      fecha_inicio_date: {
        $dateFromString: {
          dateString: "$fecha_inicio",
          format: "%d/%m/%Y"
        }
      }
    }
  },
  { $sort: { fecha_inicio_date: 1 } },
{
    $project: {
      _id:0
    }
  }
];

  const existing = await db.listCollections({ name: 'poliza_fecha_ini' }).toArray();
  if (existing.length === 0) {
    await db.createCollection('poliza_fecha_ini', { viewOn: 'clientes', pipeline });
    console.log('View `poliza_fecha_ini` creada.');
  } else {
    console.log('View `poliza_fecha_ini` ya existe.');
  }

  const results = await db.collection('poliza_fecha_ini').find().toArray();

  console.log(`Total de Pólizas activas ordenadas por fecha de inicio: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 9:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}

