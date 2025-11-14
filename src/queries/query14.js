import { error } from 'console';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

export const query14 = async (mongoClient, redisClient, siniestroInfo) => {

  const db = mongoClient.db('ensurances');

  if (await db.collection('siniestros').countDocuments({id_siniestro: siniestroInfo.id_siniestro}) > 0) {
    throw new Error(`El siniestro con id ${siniestroInfo.id_siniestro} ya existe`);
  }
  const result = await db.collection('siniestros').insertOne(siniestroInfo);
  await redisClient.flushAll();
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoClient = new MongoClient('mongodb://mongo:27017');
  const redisClient = createClient({ url: 'redis://redis:6379' });

  try {
    console.log('=== QUERY 14: Alta de nuevos siniestros ===\n');
    await mongoClient.connect();
    await redisClient.connect();

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('Error: Debe especificar los campos del siniestro');
      console.log('\nUso: npm run query14 <campo1=valor1> <campo2=valor2> ...');
      console.log('Campos obligatorios: id_siniestro, nro_poliza, fecha');
      console.log('Campos opcionales: tipo, monto_estimado, descripcion, estado');
      console.log('Ejemplo: npm run query14 id_siniestro=9999 nro_poliza=POL1001 fecha=20/3/2025 tipo=Accidente monto_estimado=500000 estado=Abierto');
      process.exit(1);
    }

    let siniestroInfo = {};
    
    // Parsear los pares campo=valor
    for (let i = 0; i < args.length; i++) {
      const [campo, valor] = args[i].split('=');
      if (!campo || valor === undefined) {
        console.error(`Error: Formato inválido en "${args[i]}". Use campo=valor`);
        process.exit(1);
      }
      
      // Convertir campos numéricos
      if (campo === 'id_siniestro' || campo === 'monto_estimado') {
        siniestroInfo[campo] = parseInt(valor);
      } else {
        siniestroInfo[campo] = valor;
      }
    }
    
    // Validar campos obligatorios
    const camposObligatorios = ['id_siniestro', 'nro_poliza', 'fecha'];
    const camposFaltantes = camposObligatorios.filter(campo => !siniestroInfo[campo]);
    
    if (camposFaltantes.length > 0) {
      console.error(`Error: Faltan los siguientes campos obligatorios: ${camposFaltantes.join(', ')}`);
      console.log('Uso: npm run query14 id_siniestro=<valor> nro_poliza=<valor> fecha=<valor> [campos_opcionales]');
      process.exit(1);
    }
    
    console.log('Agregando siniestro:', siniestroInfo);
    
    try {
      const results = await query14(mongoClient, redisClient, siniestroInfo);
      console.log('\nResultado:', JSON.stringify(results, null, 2));
      
      if (results.insertedId) {
        const check = await mongoClient.db('ensurances').collection('siniestros').find({'_id': results.insertedId}).toArray();
        console.log('\nSiniestro agregado exitosamente:', JSON.stringify(check, null, 2));
      }
    } catch (err) {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error ejecutando Query 14:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    await redisClient.quit();
  }
}
