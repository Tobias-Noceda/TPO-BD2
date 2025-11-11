import { MongoClient } from 'mongodb';

const mongoClient = new MongoClient('mongodb://mongo:27017');

try {
  await mongoClient.connect();
  const db = mongoClient.db('ensurances');

  console.log('=== QUERY 8: Siniestros tipo "Accidente" del último año ===\n');

  // Calcular fecha de hace 1 año desde hoy
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const pipeline = [
    {
      $addFields: {
        // Convertir fecha string "DD/MM/YYYY" a Date para poder filtrar
        fecha_date: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: [{ $arrayElemAt: [{ $split: ["$fecha", "/"] }, 2] }, 0, 4] }, // año
                "-",
                { $substr: [{ $arrayElemAt: [{ $split: ["$fecha", "/"] }, 1] }, 0, 2] }, // mes
                "-",
                { $substr: [{ $arrayElemAt: [{ $split: ["$fecha", "/"] }, 0] }, 0, 2] }  // día
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    },
    {
      $match: {
        tipo: "Accidente",
        fecha_date: {
          $gte: oneYearAgo,
          $lte: today
        }
      }
    },
    {
      // Lookup para traer datos del cliente (opcional, mejora info)
      $lookup: {
        from: "clientes",
        let: { poliza_num: "$nro_poliza" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$$poliza_num", "$polizas.nro_poliza"]
              }
            }
          },
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
              activo: 1
            }
          }
        ],
        as: "cliente"
      }
    },
    {
      $unwind: {
        path: "$cliente",
        preserveNullAndEmptyArrays: true  // Mantiene siniestros sin cliente encontrado
      }
    },
    {
      $project: {
        _id: 0,
        // Todos los campos del siniestro tal cual están
        id_siniestro: 1,
        nro_poliza: 1,
        fecha: 1,
        tipo: 1,
        monto_estimado: 1,
        descripcion: 1,
        estado: 1,
        // Datos del cliente tal cual están
        cliente: 1
      }
    },
    {
      $sort: { fecha_date: -1 }  // Más recientes primero
    },
    {
      // Eliminar el campo auxiliar fecha_date que solo usamos para filtrar
      $project: {
        fecha_date: 0
      }
    }
  ];

  const results = await db.collection('siniestros').aggregate(pipeline).toArray();

  console.log(`Total de siniestros tipo "Accidente" del último año: ${results.length}\n`);
  console.log(JSON.stringify(results, null, 2));

} catch (error) {
  console.error('Error ejecutando Query 8:', error);
  process.exit(1);
} finally {
  await mongoClient.close();
}

