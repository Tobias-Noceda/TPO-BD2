import { MongoClient } from 'mongodb';

export const allClients = async (client) => {
  await client.connect();
  const db = client.db('ensurances');

  const pipeline = [
    {
      $project: {
        _id: 0,
        id_cliente: 1,
        nombre: 1,
        apellido: 1,
        dni: 1,
        email: 1,
        telefono: 1,
        direccion: 1,
        ciudad: 1,
        provincia: 1,
        activo: 1,
      }
    }
  ];

  return await db.collection('clientes').aggregate(pipeline).toArray();
}
