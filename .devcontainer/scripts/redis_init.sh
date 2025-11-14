#!/bin/sh
set -e

echo "=== Redis Initialization Started ==="
echo "Populating hashes from CSVs..."

# Clean up any existing hashes
redis-cli -h redis DEL clients_multi_vehicle agents_sinisters agents_policies >/dev/null

# Hash 1: clients with more than 1 vehicle [client_id -> client_data_json]
echo "  Building clients_multi_vehicle hash..."
# First, find clients with multiple vehicles
awk -F, 'NR>1 {gsub(/\r/,""); count[$2]++} END {for (client in count) if (count[client] > 1) print client}' /csv-data/vehiculos.csv > /tmp/multi_vehicle_client_ids.txt

# Get client data from clientes.csv for those IDs
if [ -s /tmp/multi_vehicle_client_ids.txt ]; then
  while read -r client_id; do
    if [ -n "$client_id" ]; then
      # Extract client data from clientes.csv (skip header)
      client_data=$(awk -F, -v id="$client_id" 'NR>1 {gsub(/\r/,""); if ($1 == id) {
        printf "{\"id_cliente\":\"%s\",\"nombre\":\"%s\",\"apellido\":\"%s\",\"dni\":\"%s\",\"email\":\"%s\",\"telefono\":\"%s\",\"direccion\":\"%s\",\"ciudad\":\"%s\",\"provincia\":\"%s\",\"activo\":\"%s\"}", $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        exit
      }}' /csv-data/clientes.csv)
      
      if [ -n "$client_data" ]; then
        redis-cli -h redis HSET clients_multi_vehicle "$client_id" "$client_data" >/dev/null
      fi
    fi
  done < /tmp/multi_vehicle_client_ids.txt
fi

# Always ensure the hash exists (even if empty)
if [ "$(redis-cli -h redis EXISTS clients_multi_vehicle)" = "0" ]; then
  redis-cli -h redis HSET clients_multi_vehicle "__placeholder__" "{}" >/dev/null
  redis-cli -h redis HDEL clients_multi_vehicle "__placeholder__" >/dev/null
fi

# Hash 2: agents with policy count [id_agente -> policy_count]
echo "  Building agents_policies hash..."
# Get all agents (field 1 is id_agente), strip carriage returns
awk -F, 'NR>1 {gsub(/\r/,""); print $1}' /csv-data/agentes.csv | sort -u > /tmp/all_agents.txt

# Count policies per agent (field 8 is id_agente in polizas.csv)
awk -F, 'NR>1 {gsub(/\r/,""); print $8}' /csv-data/polizas.csv | sort | uniq -c | \
while read -r count agent; do
  if [ -n "$agent" ] && [ -n "$count" ]; then
    redis-cli -h redis HSET agents_policies "$agent" "$count" >/dev/null
  fi
done

# Set 0 for agents with no policies
while read -r agent; do
  if [ -n "$agent" ]; then
    exists=$(redis-cli -h redis HEXISTS agents_policies "$agent")
    if [ "$exists" = "0" ]; then
      redis-cli -h redis HSET agents_policies "$agent" "0" >/dev/null
    fi
  fi
done < /tmp/all_agents.txt

# Hash 3: agents with sinister count [id_agente -> sinister_count]
echo "  Building agents_sinisters hash..."
# Count sinisters per policy (field 2 is nro_poliza in siniestros.csv)
awk -F, 'NR>1 {gsub(/\r/,""); print $2}' /csv-data/siniestros.csv | sort | uniq -c | \
  awk '{gsub(/\r/,""); if (NF==2) print $2, $1}' > /tmp/sinisters_per_policy.txt

# Map policies to agents (field 1=nro_poliza, field 8=id_agente in polizas.csv)
awk -F, 'NR>1 {gsub(/\r/,""); if (NF>=8) print $1, $8}' /csv-data/polizas.csv > /tmp/policy_agent_map.txt

# Join and count sinisters per agent
awk 'NR==FNR {policy_count[$1]=$2; next} 
     {policy=$1; agent=$2; 
      if (policy in policy_count) agent_count[agent] += policy_count[policy]} 
     END {for (agent in agent_count) print agent, agent_count[agent]}' \
  /tmp/sinisters_per_policy.txt /tmp/policy_agent_map.txt | \
while read -r agent count; do
  if [ -n "$agent" ] && [ -n "$count" ]; then
    redis-cli -h redis HSET agents_sinisters "$agent" "$count" >/dev/null
  fi
done

# Set 0 for agents with no sinisters
while read -r agent; do
  if [ -n "$agent" ]; then
    exists=$(redis-cli -h redis HEXISTS agents_sinisters "$agent")
    if [ "$exists" = "0" ]; then
      redis-cli -h redis HSET agents_sinisters "$agent" "0" >/dev/null
    fi
  fi
done < /tmp/all_agents.txt

# Cleanup temp files
rm -f /tmp/all_agents.txt /tmp/sinisters_per_policy.txt /tmp/policy_agent_map.txt /tmp/multi_vehicle_clients.txt

# Show stats
echo ""
echo "✓ clients_multi_vehicle: $(redis-cli -h redis HLEN clients_multi_vehicle) entries"
echo "✓ agents_policies: $(redis-cli -h redis HLEN agents_policies) entries"
echo "✓ agents_sinisters: $(redis-cli -h redis HLEN agents_sinisters) entries"
echo ""
echo "=== Redis Initialization Complete ==="
exit 0
