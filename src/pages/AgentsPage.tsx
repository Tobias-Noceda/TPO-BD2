import React, { useState, useEffect } from 'react';
import Tabs, { TabsElement } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, AgenteConPolizas, AgenteConSiniestros } from '@/services/queries';

type AgentQueryType = 'with-policies' | 'with-sinisters';

export const AgentsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabsElement>({ 
    key: 'with-policies', 
    label: 'Agentes Activos con Pólizas' 
  });
  const [loading, setLoading] = useState(false);
  const [dataPolicies, setDataPolicies] = useState<AgenteConPolizas[]>([]);
  const [dataSinisters, setDataSinisters] = useState<AgenteConSiniestros[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const tabs: TabsElement[] = [
    { key: 'with-policies', label: 'Agentes Activos con Pólizas' },
    { key: 'with-sinisters', label: 'Agentes con Siniestros' },
  ];

  useEffect(() => {
    fetchData(selectedTab.key as AgentQueryType);
  }, [selectedTab]);

  const fetchData = async (queryType: AgentQueryType) => {
    setLoading(true);
    try {
      if (queryType === 'with-policies') {
        const result = await queryService.getAgentesActivosConPolizas();
        setDataPolicies(result || []);
      } else {
        const result = await queryService.getAgentesConSiniestros();
        setDataSinisters(result || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      if (queryType === 'with-policies') {
        setDataPolicies([]);
      } else {
        setDataSinisters([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabSelect = (tab: TabsElement) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const data = selectedTab.key === 'with-policies' ? dataPolicies : dataSinisters;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agentes</h1>
        <p className="text-gray-500 mt-1">Gestión de agentes de seguros</p>
      </div>

      <Tabs options={tabs} selected={selectedTab} onSelect={handleTabSelect} />

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTab.key === 'with-policies' 
              ? 'Agentes Activos con Pólizas' 
              : 'Agentes con Siniestros (Redis)'}
          </CardTitle>
          <CardDescription>
            {selectedTab.key === 'with-policies'
              ? 'Agentes activos ordenados por cantidad de pólizas asignadas'
              : 'Agentes ordenados por cantidad de siniestros asociados a sus pólizas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Zona</TableHead>
                <TableHead>Cantidad de Pólizas</TableHead>
                {selectedTab.key === 'with-sinisters' && (
                  <TableHead>Cantidad de Siniestros</TableHead>
                )}
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={selectedTab.key === 'with-policies' ? 8 : 9} className="text-center py-8">
                    <div className="animate-pulse">Cargando datos...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={selectedTab.key === 'with-policies' ? 8 : 9} className="text-center py-8 text-gray-500">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : selectedTab.key === 'with-policies' ? (
                (currentData as AgenteConPolizas[]).map((agente) => (
                  <TableRow key={agente.id_agente}>
                    <TableCell>{agente.id_agente}</TableCell>
                    <TableCell>{agente.nombre} {agente.apellido}</TableCell>
                    <TableCell>{agente.matricula}</TableCell>
                    <TableCell>{agente.telefono}</TableCell>
                    <TableCell>{agente.email}</TableCell>
                    <TableCell>{agente.zona}</TableCell>
                    <TableCell>
                      <Badge variant="info">{agente.cantidad_polizas}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agente.activo === 'True' ? 'success' : 'danger'}>
                        {agente.activo === 'True' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                (currentData as AgenteConSiniestros[]).map((agente) => (
                  <TableRow key={agente.id_agente}>
                    <TableCell>{agente.id_agente}</TableCell>
                    <TableCell>{agente.nombre} {agente.apellido}</TableCell>
                    <TableCell>{agente.matricula}</TableCell>
                    <TableCell>{agente.telefono || '-'}</TableCell>
                    <TableCell>{agente.email}</TableCell>
                    <TableCell>{agente.zona}</TableCell>
                    <TableCell>
                      <Badge variant="info">{agente.cantidad_polizas}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agente.cantidad_siniestros > 0 ? 'warning' : 'success'}>
                        {agente.cantidad_siniestros}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agente.activo === 'True' ? 'success' : 'danger'}>
                        {agente.activo === 'True' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              isLoading={loading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
