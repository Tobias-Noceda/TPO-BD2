import { error } from 'console';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

export const query15 = async (mongoClient, redisClient, polizasInfo) => {

  const db = mongoClient.db('ensurances');

  // si no existe el agente
  if (await db.collection('agentes').countDocuments({id_agente: polizasInfo.id_agente}) == 0) {
    throw new Error(`Agente con id ${polizasInfo.id_agente} no existe`);
  }
  
  // si no existe el cliente
  if (await db.collection('clientes').countDocuments({id_cliente: polizasInfo.id_cliente}) == 0) {
    throw new Error(`Cliente con id ${polizasInfo.id_cliente} no existe`);
  }

  const result = await db.collection('clientes').updateOne({id_cliente: polizasInfo.id_cliente}, { $push: { polizas: polizasInfo } });
  await redisClient.flushAll();
  return result;
}

const mongoClient = new MongoClient('mongodb://mongo:27017');
const redisClient = createClient({ url: 'redis://redis:6379' });

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    console.log('=== QUERY 15: Emisión de nuevas pólizas ===\n');

    await mongoClient.connect();
    await redisClient.connect();

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('Error: Debe especificar los campos de la póliza');
      console.log('\nUso: npm run query15 <campo1=valor1> <campo2=valor2> ...');
      console.log('Campos obligatorios: nro_poliza, id_cliente, tipo, fecha_inicio, id_agente');
      console.log('Campos opcionales: fecha_fin, prima_mensual, cobertura_total, estado');
      console.log('Ejemplo: npm run query15 nro_poliza=POL9999 id_cliente=1 tipo=Auto fecha_inicio=15/1/2025 id_agente=101 prima_mensual=25000 estado=Activa');
      process.exit(1);
    }

    let polizasInfo = {};
    
    // Parsear los pares campo=valor
    for (let i = 0; i < args.length; i++) {
      const [campo, valor] = args[i].split('=');
      if (!campo || valor === undefined) {
        console.error(`Error: Formato inválido en "${args[i]}". Use campo=valor`);
        process.exit(1);
      }
      
      // Convertir campos numéricos
      if (campo === 'id_cliente' || campo === 'id_agente' || campo === 'prima_mensual' || campo === 'cobertura_total') {
        polizasInfo[campo] = parseInt(valor);
      } else {
        polizasInfo[campo] = valor;
      }
    }
    
    // Validar campos obligatorios
    const camposObligatorios = ['nro_poliza', 'id_cliente', 'tipo', 'fecha_inicio', 'id_agente'];
    const camposFaltantes = camposObligatorios.filter(campo => !polizasInfo[campo]);
    
    if (camposFaltantes.length > 0) {
      console.error(`Error: Faltan los siguientes campos obligatorios: ${camposFaltantes.join(', ')}`);
      console.log('Uso: npm run query15 nro_poliza=<valor> id_cliente=<valor> tipo=<valor> fecha_inicio=<valor> id_agente=<valor> [campos_opcionales]');
      process.exit(1);
    }
    
    console.log('Agregando póliza:', polizasInfo);
    
    try {
      const results = await query15(mongoClient, redisClient, polizasInfo);
      console.log('\nResultado:', JSON.stringify(results, null, 2));
      
      if (results.modifiedCount > 0) {
        const check = await mongoClient.db('ensurances').collection('clientes').find({id_cliente: polizasInfo.id_cliente}).toArray();
        console.log('\nPóliza agregada exitosamente al cliente:', JSON.stringify(check, null, 2));
      } else {
        console.log('\nAdvertencia: No se pudo agregar la póliza. Verifique que el cliente exista.');
      }
    } catch (err) {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error ejecutando Query 15:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    await redisClient.quit();
  }
}
