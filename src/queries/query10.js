import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const PIPELINE = [
	{ $unwind: '$polizas' },
	{
		$addFields: {
			pol_estado: '$polizas.estado'
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
			polizas: 1
		}
	}
];

export const query10 = async (redisClient, mongoClient) => {
	const cacheKey = 'query10:suspended-policies';
	const cacheTTL = 300;

	const cached = await redisClient.get(cacheKey);
	if (cached) {
		console.log('✓ Retrieved from Redis cache');
		return JSON.parse(cached);
	}

	const db = mongoClient.db('ensurances');
	const results = await db.collection('clientes').aggregate(PIPELINE).toArray();

	await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));
	return results;
};

if (import.meta.url === `file://${process.argv[1]}`) {
	const redisClient = createClient({ url: 'redis://redis:6379' });
	const mongoClient = new MongoClient('mongodb://mongo:27017');

	try {
		await redisClient.connect();
		await mongoClient.connect();
		console.log('=== QUERY 10: Pólizas suspendidas con estado del cliente ===');

		const results = await query10(redisClient, mongoClient);
		console.log(`Total de Pólizas suspendidas con estado del cliente: ${results.length}`);
		console.log(JSON.stringify(results, null, 2));
	} catch (error) {
		console.error('Error ejecutando Query 10:', error);
		process.exit(1);
	} finally {
		await redisClient.quit();
		await mongoClient.close();
	}
}

