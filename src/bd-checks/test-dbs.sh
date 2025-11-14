#!/bin/bash

echo "=== Testing MongoDB ==="
echo "Connecting to MongoDB at mongo:27017..."
mongosh --host mongo --quiet --eval "
use ensurances;
print('Collections:');
db.getCollectionNames().forEach(c => print('  - ' + c));
print('\\nClientes count: ' + db.clientes.countDocuments());
print('Agentes count: ' + db.agentes.countDocuments());
print('Siniestros count: ' + db.siniestros.countDocuments());
print('\\nFirst client with embedded data:');
printjson(db.clientes.findOne());
"

echo ""
echo "=== Testing Redis ==="
echo "Connecting to Redis at redis:6379..."
redis-cli -h redis <<EOF
PING
HLEN clients_multi_vehicle
HLEN agents_policies
HLEN agents_sinisters
HGETALL clients_multi_vehicle
EOF

echo ""
echo "=== Test complete ==="
