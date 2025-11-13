import { error } from 'console';
import { MongoClient } from 'mongodb';

export const query14 = async (client, siniestroInfo) => {
  await client.connect();
  const db = client.db('ensurances');

      if (await db.collection('siniestros').countDocuments({id_siniestro: siniestroInfo.id_siniestro}) > 0) {
        return error(`El siniestro con id ${siniestroInfo.id_siniestro} ya existe`);
      }
    return db.collection('siniestros').insertOne(siniestroInfo);
  }

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  console.log('=== QUERY 14: Alta de nuevos siniestros Siniestros ===\n');

  // const results = await query14(mongoClient, siniestroInfo);
  // console.log(JSON.stringify(results, null, 2));

  // SiniestroInfo me lo pasan por la API. Esto es dummy solamente para probar. 
  let siniestroInfo = {
    id_siniestro: 101,
    nro_poliza: 'POL1001',
    fecha: '20/3/2025',
    tipo: 'Accidente',
    monto_estimado: 500000,
    descripcion: 'Colision frontal en autopista',
    estado: 'Abierto'
  };

  // TEST ADD dummy
  const results = await query14(mongoClient, siniestroInfo);
  console.log(JSON.stringify(results, null, 2));
  const check = await mongoClient.db('ensurances').collection('siniestros').find({'_id':results.insertedId}).toArray();
  console.log('Siniestro agregado:', JSON.stringify(check, null, 2));
  
} catch (error) {
  console.error('Error ejecutando Query 14:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}