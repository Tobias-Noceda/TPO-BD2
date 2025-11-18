import { error } from 'console';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

const Action = {
  ADD: 'Add',
  MODIFY: 'Modify',
  DELETE: 'Delete'
}

export const query13 = async (mongoClient, redisClient, action, clientInfo) => {

  const db = mongoClient.db('ensurances');
  let result;

  switch(action) {
    case Action.DELETE:
    result = await db.collection('clientes').deleteOne({id_cliente: clientInfo.id_cliente});
    await redisClient.flushAll();
    return result;

    case Action.ADD:
      if (await db.collection('clientes').countDocuments({id_cliente: clientInfo.id_cliente}) > 0) {
        throw new Error(`El cliente con id ${clientInfo.id_cliente} ya existe`);
      }
    result = await db.collection('clientes').insertOne(clientInfo);
    await redisClient.flushAll();
    return result;

     case Action.MODIFY:
        result = await db.collection('clientes').updateOne(
        {id_cliente: clientInfo.id_cliente},
        { $set: clientInfo},
        {upsert:false} // asumo que si el cliente no existe, no hago nada.
      );
    await redisClient.flushAll();
    return result;

    default:
      return error('Acción no válida');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoClient = new MongoClient('mongodb://mongo:27017');
  const redisClient = createClient({ url: 'redis://redis:6379' });
  
  try {
    console.log('=== QUERY 13: ABM Clientes ===\n');

    await mongoClient.connect();
    await redisClient.connect();

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('Error: Debe especificar una acción (Add, Modify, Delete)');
      console.log('\nUso:');
      console.log('  Agregar:   npm run query13 Add <campo1=valor1> <campo2=valor2> ...');
      console.log('             Campos obligatorios: id_cliente, nombre, email');
      console.log('             Ejemplo: npm run query13 Add id_cliente=209 nombre=Juan email=juan@example.com apellido=Pérez');
      console.log('  Modificar: npm run query13 Modify <id_cliente> <campo1=valor1> <campo2=valor2> ...');
      console.log('  Eliminar:  npm run query13 Delete <id_cliente>');
      process.exit(1);
    }

    const action = args[0];
    let clientInfo = {};
    let results;

    switch(action) {
      case 'Add':
        // Validar que se reciban al menos los campos obligatorios
        if (args.length < 2) {
          console.error('Error: Debe especificar los campos del cliente');
          console.log('Uso: npm run query13 Add <campo1=valor1> <campo2=valor2> ...');
          console.log('Campos obligatorios: id_cliente, nombre, email');
          console.log('Campos opcionales: apellido, dni, telefono, direccion, ciudad, provincia, activo');
          console.log('Ejemplo: npm run query13 Add id_cliente=209 nombre=Juan email=juan@example.com apellido=Pérez dni=12345678');
          process.exit(1);
        }
        
        clientInfo = {};
        
        // Parsear los pares campo=valor
        for (let i = 1; i < args.length; i++) {
          const [campo, valor] = args[i].split('=');
          if (!campo || valor === undefined) {
            console.error(`Error: Formato inválido en "${args[i]}". Use campo=valor`);
            process.exit(1);
          }
          
          // Convertir id_cliente a número si es necesario
          if (campo === 'id_cliente') {
            clientInfo[campo] = parseInt(valor);
          } else {
            clientInfo[campo] = valor;
          }
        }
        
        // Validar campos obligatorios
        const camposObligatorios = ['id_cliente', 'nombre', 'email'];
        const camposFaltantes = camposObligatorios.filter(campo => !clientInfo[campo]);
        
        if (camposFaltantes.length > 0) {
          console.error(`Error: Faltan los siguientes campos obligatorios: ${camposFaltantes.join(', ')}`);
          console.log('Uso: npm run query13 Add id_cliente=<valor> nombre=<valor> email=<valor> [campos_opcionales]');
          process.exit(1);
        }
        
        console.log('Agregando cliente:', clientInfo);

        if (!clientInfo.hasOwnProperty('activo')) {
          clientInfo.activo = "True";
        }
        if (!clientInfo.hasOwnProperty('vehiculos')) {
          clientInfo.vehiculos = [];
        }
        if (!clientInfo.hasOwnProperty('polizas')) {
          clientInfo.polizas = [];
        }
        
        try {
          results = await query13(mongoClient, redisClient, Action.ADD, clientInfo);
          console.log('\nResultado:', JSON.stringify(results, null, 2));
          
          if (results.insertedId) {
            const check = await mongoClient.db('ensurances').collection('clientes').find({'_id': results.insertedId}).toArray();
            console.log('\nCliente agregado exitosamente:', JSON.stringify(check, null, 2));
          }
        } catch (err) {
          console.error('\n❌ Error:', err.message);
          process.exit(1);
        }
        break;

      case 'Modify':
        // Validar que se reciba al menos el id_cliente
        if (args.length < 3) {
          console.error('Error: Debe especificar el id_cliente y al menos un campo a modificar');
          console.log('Uso: npm run query13 Modify <id_cliente> <campo1=valor1> <campo2=valor2> ...');
          console.log('Ejemplo: npm run query13 Modify 208 nombre=Juan apellido=Pérez email=juan@example.com');
          process.exit(1);
        }

        clientInfo = {
          id_cliente: parseInt(args[1])
        };

        // Parsear los pares campo=valor
        for (let i = 2; i < args.length; i++) {
          const [campo, valor] = args[i].split('=');
          if (!campo || valor === undefined) {
            console.error(`Error: Formato inválido en "${args[i]}". Use campo=valor`);
            process.exit(1);
          }
          clientInfo[campo] = valor;
        }

        console.log('Modificando cliente:', clientInfo);
        results = await query13(mongoClient, redisClient, Action.MODIFY, clientInfo);
        console.log('\nResultado:', JSON.stringify(results, null, 2));
        
        if (results.modifiedCount > 0) {
          const check = await mongoClient.db('ensurances').collection('clientes').find({id_cliente: clientInfo.id_cliente}).toArray();
          console.log('\nCliente modificado exitosamente:', JSON.stringify(check, null, 2));
        } else {
          console.log('\nAdvertencia: No se modificó ningún cliente. Verifique que el id_cliente exista.');
        }
        break;

      case 'Delete':
        // Validar que se reciba el id_cliente
        if (args.length < 2) {
          console.error('Error: Debe especificar el id_cliente a eliminar');
          console.log('Uso: npm run query13 Delete <id_cliente>');
          process.exit(1);
        }

        clientInfo = {
          id_cliente: parseInt(args[1])
        };

        console.log('Eliminando cliente con id:', clientInfo.id_cliente);
        results = await query13(mongoClient, redisClient, Action.DELETE, clientInfo);
        console.log('\nResultado:', JSON.stringify(results, null, 2));
        
        if (results.deletedCount > 0) {
          console.log(`\nCliente con id ${clientInfo.id_cliente} eliminado exitosamente.`);
        } else {
          console.log(`\nAdvertencia: No se encontró ningún cliente con id ${clientInfo.id_cliente}.`);
        }
        break;

      default:
        console.error(`Error: Acción "${action}" no válida. Use Add, Modify o Delete`);
        process.exit(1);
    }

  } catch (error) {
    console.error('Error ejecutando Query 13:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    await redisClient.quit();
  }
}
