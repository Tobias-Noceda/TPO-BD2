import { error } from 'console';
import { MongoClient } from 'mongodb';

const Action = {
  ADD: 'Add',
  MODIFY: 'Modify',
  DELETE: 'Delete'
}

export const query13 = async (client, action, clientInfo) => {
  await client.connect();
  const db = client.db('ensurances');

  switch(action) {
    case Action.DELETE:
    return db.collection('clientes').deleteOne({id_cliente: clientInfo.id_cliente});
    
    case Action.ADD:
      if (await db.collection('clientes').find({id_cliente: clientInfo.id_cliente}).countDocuments() > 0) {
        return error('El cliente ya existe');
      }
    return db.collection('clientes').insertOne(clientInfo);
    
     case Action.MODIFY:
        return db.collection('clientes').updateOne(
        {id_cliente: clientInfo.id_cliente},
        { $set: clientInfo},
        {upsert:false} // asumo que si el cliente no existe, no hago nada.
      );
  
    default:
      return error('Acción no válida');
  }
}

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  console.log('=== QUERY 13: ABM Clientes ===\n');

  // const results = await query13(mongoClient, action, clientInfo);
  // console.log(JSON.stringify(results, null, 2));

  // ClientInfo y action me lo pasan por la API. Esto es dummy solamente para probar. 
  let action = Action.ADD;
  let clientInfo = {
    id_cliente: 207,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com'
  };

  // TEST ADD dummy
  const results = await query13(mongoClient, action, clientInfo);
  console.log(JSON.stringify(results, null, 2));
  const check = await mongoClient.db('ensurances').collection('clientes').find({'_id':results.insertedId}).toArray();
  console.log('Cliente agregado:', JSON.stringify(check, null, 2));

  // TEST MODIFY dummy
  action = Action.MODIFY;
  clientInfo = {
    id_cliente: 207,
    nombre: 'Juancio',
    apellido: 'Péresoooon',
    email: 'juancio.peresooooon@example.com'
  };
  const results2 = await query13(mongoClient, action, clientInfo);
  console.log('Cliente modificado:', JSON.stringify(results2, null, 2));
  const check2 = await mongoClient.db('ensurances').collection('clientes').find({id_cliente:207}).toArray();
  console.log('Cliente modificado check:', JSON.stringify(check2, null, 2));

  // TEST DELETE dummy
  action = Action.DELETE;
  const results3 = await query13(mongoClient, action, clientInfo);
  console.log('Cliente eliminado:', JSON.stringify(results3, null, 2));
  const check3 = await mongoClient.db('ensurances').collection('clientes').find({id_cliente:207}).toArray();
  console.log('Cliente eliminado check (debería estar vacío):', JSON.stringify(check3, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 13:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}