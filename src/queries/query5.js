import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const PIPELINE = [
	{ $match: { activo: 'True' } },
	{
		$lookup: {
			from: 'clientes',
			let: { agenteId: '$id_agente' },
			pipeline: [
				{ $unwind: '$polizas' },
				{
					$match: {
						$expr: {
							$eq: ['$$agenteId', '$polizas.id_agente']
						}
					}
				},
				{
					$group: {
						_id: null,
						total_polizas: { $sum: 1 }
					}
				}
			],
			as: 'polizas_asignadas'
		}
	},
	{
		$addFields: {
			cantidad_polizas: {
				$ifNull: [{ $first: '$polizas_asignadas.total_polizas' }, 0]
			}
		}
	},
	{
		$project: {
			_id: 0,
			id_agente: 1,
			nombre: 1,
			apellido: 1,
			matricula: 1,
			telefono: 1,
			email: 1,
			zona: 1,
			activo: 1,
			cantidad_polizas: 1
		}
	},
	{ $sort: { cantidad_polizas: -1, apellido: 1 } }
];

export const query5 = async (redisClient, mongoClient) => {
	const cacheKey = 'query5:active-agents-policy-count';
	const cacheTTL = 300;

	const cached = await redisClient.get(cacheKey);
	if (cached) {
		console.log('✓ Retrieved from Redis cache');
		return JSON.parse(cached);
	}

	const db = mongoClient.db('ensurances');
	const results = await db.collection('agentes').aggregate(PIPELINE).toArray();

	await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(results));
	return results;
};

if (import.meta.url === `file://${process.argv[1]}`) {
	const redisClient = createClient({ url: 'redis://redis:6379' });
	const mongoClient = new MongoClient('mongodb://mongo:27017');

	try {
		await redisClient.connect();
		await mongoClient.connect();
		console.log('=== QUERY 5: Agentes activos con cantidad de pólizas asignadas ===');

		const results = await query5(redisClient, mongoClient);
		console.log(`Total de agentes activos encontrados: ${results.length}`);
		console.log(JSON.stringify(results, null, 2));
	} catch (error) {
		console.error('Error ejecutando Query 5:', error);
		process.exit(1);
	} finally {
		await redisClient.quit();
		await mongoClient.close();
	}
}
