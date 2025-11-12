import { createClient } from 'redis';

export const query11 = async (redisClient) => {
  // Query 11: Clientes con más de un vehículo asegurado
  // Uses Redis hash: clients_multi_vehicle
  
  const allClients = await redisClient.hGetAll('clients_multi_vehicle');
  
  // Parse JSON strings back to objects
  const results = Object.entries(allClients).map(([clientId, clientDataJson]) => {
    const clientData = JSON.parse(clientDataJson);
    return {
      ...clientData,
      id_cliente: parseInt(clientId, 10)
    };
  });
  
  return results;
};

// Standalone execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const redisClient = createClient({ url: 'redis://redis:6379' });
  
  try {
    await redisClient.connect();
    console.log('=== QUERY 11: Clientes con más de un vehículo asegurado ===\n');
    
    const results = await query11(redisClient);
    console.log(`Total de clientes con múltiples vehículos: ${results.length}\n`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error ejecutando Query 11:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
  }
}
