import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 10: Pólizas suspendidas con estado del cliente ===\n');

  const pipeline = [
    { $unwind: "$polizas" },
  	{
  	  $addFields: {
  	    pol_estado: "$polizas.estado"
  	  }
  	},
  	{
    $match: {
    		pol_estado: { $eq: 'Suspendida' } 
    	}
 	 },
  	{
    		$project: {
    			  _id: 0,
      			activo: 1,
    			polizas:1
   		 }
 	 }];

  const results = await db.collection('clientes').aggregate(pipeline).toArray();

  console.log(`Total de Pólizas suspendidas con estado del cliente: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 10:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}

