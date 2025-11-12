import React, { useState, useEffect } from 'react';
import Tabs, { TabsElement } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, Siniestro, SiniestroAbierto } from '@/services/queries';

type ClaimQueryType = 'open-claims' | 'accidents-last-year' | 'all-claims';

export const ClaimsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabsElement>({ 
    key: 'open-claims', 
    label: 'Siniestros Abiertos' 
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Siniestro[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const tabs: TabsElement[] = [
    { key: 'open-claims', label: 'Siniestros Abiertos' },
    { key: 'accidents-last-year', label: 'Accidentes Último Año' },
    { key: 'all-claims', label: 'Todos los Siniestros' },
  ];

  useEffect(() => {
    fetchData(selectedTab.key as ClaimQueryType);
  }, [selectedTab]);

  const fetchData = async (queryType: ClaimQueryType) => {
    setLoading(true);
    try {
      let result;
      switch (queryType) {
        case 'open-claims':
          result = await queryService.getSiniestrosAbiertos();
          break;
        case 'accidents-last-year':
          result = await queryService.getSiniestrosAccidentes();
          break;
        case 'all-claims':
          result = await queryService.getAllSiniestros();
          break;
      }
      setData(result || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabSelect = (tab: TabsElement) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const getEstadoVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'abierto':
        return 'warning';
      case 'cerrado':
        return 'success';
      case 'en proceso':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTipoVariant = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'accidente':
        return 'danger';
      case 'robo':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Siniestros</h1>
        <p className="text-gray-500 mt-1">Gestión de siniestros y reclamaciones</p>
      </div>

      <Tabs options={tabs} selected={selectedTab} onSelect={handleTabSelect} />

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTab.key === 'open-claims'
              ? 'Siniestros Abiertos con Cliente Afectado'
              : selectedTab.key === 'accidents-last-year' 
                ? 'Siniestros Tipo "Accidente" del Último Año'
                : 'Todos los Siniestros'
            }
          </CardTitle>
          <CardDescription>
            {selectedTab.key === 'open-claims'
              ? 'Siniestros en estado "Abierto" o "En proceso" con información del cliente'
              : selectedTab.key === 'accidents-last-year'
                ? 'Listado de accidentes reportados en los últimos 12 meses'
                : 'Listado completo de todos los siniestros registrados'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nro. Póliza</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto Estimado</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cliente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse">Cargando datos...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((siniestro) => (
                  <TableRow key={siniestro.id_siniestro}>
                    <TableCell>{siniestro.id_siniestro}</TableCell>
                    <TableCell>{siniestro.nro_poliza}</TableCell>
                    <TableCell>{siniestro.fecha}</TableCell>
                    <TableCell>
                      <Badge variant={getTipoVariant(siniestro.tipo)}>
                        {siniestro.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>${siniestro.monto_estimado.toLocaleString()}</TableCell>
                    <TableCell className="max-w-xs truncate" title={siniestro.descripcion}>
                      {siniestro.descripcion}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEstadoVariant(siniestro.estado)}>
                        {siniestro.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {siniestro.cliente 
                        ? `${siniestro.cliente.nombre} ${siniestro.cliente.apellido}`
                        : '-'
                      }
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
