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
    return db.collection('clientes').insertOne(clientInfo);
    // return db.collection('clientes').find({id_cliente:206});
    
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

  // ClientInfo me lo pasan por la API. Esto es dummy solamente para probar. 
  const action = Action.ADD;

  const clientInfo = {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com'
  };

  const results = await query13(mongoClient, action, clientInfo);
  console.log(JSON.stringify(results, null, 2));
  const check = await mongoClient.db('ensurances').collection('clientes').find({'_id':results.insertedId}).toArray();
  console.log('Cliente agregado:', JSON.stringify(check, null, 2));
  
} catch (error) {
  console.error('Error ejecutando Query 13:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}