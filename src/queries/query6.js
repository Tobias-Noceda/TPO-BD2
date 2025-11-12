import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 6: Pólizas vencidas con el nombre del cliente ===\n');

  const pipeline = [
    { $unwind: "$polizas" },
    {$addFields:{pol_estado:"$polizas.estado"}},
  	{$match: {pol_estado: { $eq: 'Vencida' } }},
  	{ $project: 
      {
    			  _id: 0,
      			nombre: 1,
            apellido:1,
    			polizas:1
   		 }
 	 }];

  const results = await db.collection('clientes').aggregate(pipeline).toArray();

  console.log(`Total de Pólizas vencidas con el nombre del cliente: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 6:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}

