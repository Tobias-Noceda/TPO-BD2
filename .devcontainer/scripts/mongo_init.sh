#!/bin/sh
set -e

echo "=== MongoDB Initialization Started ==="
echo "Importing CSVs into 'ensurances' database..."

# Import all CSVs into temporary collections
for csv in /csv-data/*.csv; do
  [ -e "$csv" ] || continue
  collection=$(basename "$csv" .csv)
  echo "  Importing ${collection}.csv..."
  mongoimport --host mongo --db ensurances --collection "${collection}_temp" \
    --type csv --headerline --file "$csv" --drop --quiet
done

echo ""
echo "Restructuring data with aggregations..."

# Use mongosh to restructure the data
mongosh --host mongo --quiet --eval '
const db = db.getSiblingDB("ensurances");

// Copy agentes and siniestros as-is
db.agentes_temp.aggregate([{ $out: "agentes" }]);
db.siniestros_temp.aggregate([{ $out: "siniestros" }]);

// Build clients with embedded vehicles and policies
db.clientes_temp.aggregate([
  {
    $lookup: {
      from: "vehiculos_temp",
      localField: "id_cliente",
      foreignField: "id_cliente",
      as: "vehiculos"
    }
  },
  {
    $lookup: {
      from: "polizas_temp",
      localField: "id_cliente",
      foreignField: "id_cliente",
      as: "polizas"
    }
  },
  { $out: "clientes" }
]);

// Clean up temporary collections
db.clientes_temp.drop();
db.polizas_temp.drop();
db.siniestros_temp.drop();
db.vehiculos_temp.drop();
db.agentes_temp.drop();

// Show final stats
print("✓ Clientes: " + db.clientes.countDocuments());
print("✓ Agentes: " + db.agentes.countDocuments());
print("✓ Siniestros: " + db.siniestros.countDocuments());
'

echo ""
echo "=== MongoDB Initialization Complete ==="
exit 0
