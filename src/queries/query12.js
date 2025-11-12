import { createClient } from 'redis';

export const query12 = async (redisClient) => {
  // Query 12: Agentes y cantidad de siniestros asociados
  // Uses Redis hashes: agents_sinisters and agents_policies
  
  const agentsSinisters = await redisClient.hGetAll('agents_sinisters');
  const agentsPolicies = await redisClient.hGetAll('agents_policies');
  
  const results = Object.entries(agentsSinisters).map(([agentId, sinisterCount]) => {
    return {
      id_agente: parseInt(agentId, 10),
      cantidad_siniestros: parseInt(sinisterCount, 10),
      cantidad_polizas: parseInt(agentsPolicies[agentId] || 0, 10)
    };
  });
  
  results.sort((a, b) => b.cantidad_siniestros - a.cantidad_siniestros);
  
  return results;
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  
  try {
    await redisClient.connect();
    console.log('=== QUERY 12: Agentes y cantidad de siniestros asociados ===\n');
    
    const results = await query12(redisClient);
    console.log(`Total de agentes con siniestros: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 12:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
  }
}
