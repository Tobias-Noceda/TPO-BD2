import { createClient } from 'redis';

export const query2 = async (redisClient) => {
  // Query 2: Siniestros abiertos con tipo, monto y cliente afectado
  // Usamos Redis aca para mejorar el performance cacheando la data
  
  const cacheKey = 'query2:open_claims';
  
  // Primero intentamos en la cache de Redis
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log('✓ Retrieved from Redis cache');
    return JSON.parse(cached);
  }
  
  // Si no esta en cache, vamos a MongoDB
  return [];
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  
  try {
    await redisClient.connect();
    console.log('=== QUERY 2: Siniestros abiertos con tipo, monto y cliente afectado ===\n');
    
    const results = await query2(redisClient);
    console.log(`Total de siniestros abiertos: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 2:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
  }
}
