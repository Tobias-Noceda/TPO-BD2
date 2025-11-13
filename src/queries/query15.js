import { error } from 'console';
import { MongoClient } from 'mongodb';

export const query15 = async (client, polizasInfo) => {
  await client.connect();
  const db = client.db('ensurances');

  // si no existe el agente
      if (await db.collection('agentes').countDocuments({id_agente: polizasInfo.id_agente}) == 0) {
        return error(`Agente con id ${polizasInfo.id_agente} no existe`);
      }
  
  // si no existe el cliente
      if (await db.collection('clientes').countDocuments({id_cliente: polizasInfo.id_cliente}) == 0) {
        return error(`Cliente con id ${polizasInfo.id_cliente} no existe`);
      }
  

    return db.collection('clientes').updateOne({id_cliente: polizasInfo.id_cliente}, { $push: { polizas: polizasInfo } });
  }

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  console.log('=== QUERY 15: Emisión de nuevas pólizas ===\n');

  // const results = await query15(mongoClient, polizasInfo);
  // console.log(JSON.stringify(results, null, 2));

  // PolizasInfo me lo pasan por la API. Esto es dummy solamente para probar. 
  let polizasInfo = {
      nro_poliza: 'POL1001',
      id_cliente: 1,
      tipo: 'Auto',
      fecha_inicio: '15/1/2025',
      fecha_fin: '15/1/2026',
      prima_mensual: 25000,
      cobertura_total: 2000000,
      id_agente: 101,
      estado: 'Activa'
  };

  // TEST updateOne dummy
  const results = await query15(mongoClient, polizasInfo);
  console.log(JSON.stringify(results, null, 2));
  const check = await mongoClient.db('ensurances').collection('clientes').find({id_cliente: polizasInfo.id_cliente}).toArray();
  console.log('Poliza agregado:', JSON.stringify(check, null, 2));
  
} catch (error) {
  console.error('Error ejecutando Query 15:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}