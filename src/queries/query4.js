import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 4: Clientes sin pólizas activas ===\n');

  const pipeline = [
    { $unwind: "$polizas" },
  	{
  	  $addFields: {
  	    pol_estado: "$polizas.estado"
  	  }
  	},
  	{
    $match: {
    		pol_estado: { $nin: ['Activa'] } 
    	}
 	 },
  	{
    		$project: {
    			  _id: 0,
            vehiculos:0,
            polizas:0,
            pol_estado:0
   		 }
 	 }];

  const results = await db.collection('clientes').aggregate(pipeline).toArray();

  console.log(`Total de clientes sin pólizas activas: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 4:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}

