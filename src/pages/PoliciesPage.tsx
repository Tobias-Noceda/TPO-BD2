import React, { useState, useEffect } from 'react';
import Tabs, { TabsElement } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, PolizaVencida, Poliza, PolizaSuspendida } from '@/services/queries';

type PolicyQueryType = 'expired-policies' | 'active-policies' | 'suspended-policies';

export const PoliciesPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabsElement>({ 
    key: 'expired-policies', 
    label: 'Pólizas Vencidas' 
  });
  const [loading, setLoading] = useState(false);
  const [dataExpired, setDataExpired] = useState<PolizaVencida[]>([]);
  const [dataActive, setDataActive] = useState<Poliza[]>([]);
  const [dataSuspended, setDataSuspended] = useState<PolizaSuspendida[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const tabs: TabsElement[] = [
    { key: 'expired-policies', label: 'Pólizas Vencidas' },
    { key: 'active-policies', label: 'Pólizas Activas' },
    { key: 'suspended-policies', label: 'Pólizas Suspendidas' },
  ];

  useEffect(() => {
    fetchData(selectedTab.key as PolicyQueryType);
  }, [selectedTab]);

  const fetchData = async (queryType: PolicyQueryType) => {
    setLoading(true);
    try {
      if (queryType === 'expired-policies') {
        const result = await queryService.getPolizasVencidas();
        setDataExpired(result || []);
      } else if (queryType === 'active-policies') {
        const result = await queryService.getPolizasActivasOrdenadas();
        setDataActive(result || []);
      } else {
        const result = await queryService.getPolizasSuspendidas();
        setDataSuspended(result || []);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      if (queryType === 'expired-policies') {
        setDataExpired([]);
      } else if (queryType === 'active-policies') {
        setDataActive([]);
      } else {
        setDataSuspended([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabSelect = (tab: TabsElement) => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const getData = () => {
    if (selectedTab.key === 'expired-policies') return dataExpired;
    if (selectedTab.key === 'active-policies') return dataActive;
    return dataSuspended;
  };

  const data = getData();
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const getTipoVariant = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'auto':
        return 'info';
      case 'vida':
        return 'success';
      case 'hogar':
        return 'warning';
      case 'salud':
        return 'danger';
      default:
        return 'default';
    }
  };

  const renderTableHeaders = () => {
    if (selectedTab.key === 'expired-policies') {
      return (
        <TableRow>
          <TableHead>Nro. Póliza</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Fecha Inicio</TableHead>
          <TableHead>Fecha Fin</TableHead>
          <TableHead>Prima Mensual</TableHead>
          <TableHead>Cobertura Total</TableHead>
          <TableHead>ID Agente</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      );
    } else if (selectedTab.key === 'active-policies') {
      return (
        <TableRow>
          <TableHead>Nro. Póliza</TableHead>
          <TableHead>ID Cliente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Fecha Inicio</TableHead>
          <TableHead>Fecha Fin</TableHead>
          <TableHead>Prima Mensual</TableHead>
          <TableHead>Cobertura Total</TableHead>
          <TableHead>ID Agente</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      );
    } else {
      return (
        <TableRow>
          <TableHead>Nro. Póliza</TableHead>
          <TableHead>Cliente Activo</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Fecha Inicio</TableHead>
          <TableHead>Fecha Fin</TableHead>
          <TableHead>Prima Mensual</TableHead>
          <TableHead>Cobertura Total</TableHead>
          <TableHead>ID Agente</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      );
    }
  };

  const renderTableContent = () => {
    if (selectedTab.key === 'expired-policies') {
      return (currentData as PolizaVencida[]).map((item, index) => (
        <TableRow key={`${item.polizas.nro_poliza}-${index}`}>
          <TableCell>{item.polizas.nro_poliza}</TableCell>
          <TableCell>{item.nombre} {item.apellido}</TableCell>
          <TableCell>
            <Badge variant={getTipoVariant(item.polizas.tipo)}>
              {item.polizas.tipo}
            </Badge>
          </TableCell>
          <TableCell>{item.polizas.fecha_inicio}</TableCell>
          <TableCell>{item.polizas.fecha_fin || '-'}</TableCell>
          <TableCell>${(item.polizas.prima_mensual || 0).toLocaleString()}</TableCell>
          <TableCell>${(item.polizas.cobertura_total || 0).toLocaleString()}</TableCell>
          <TableCell>{item.polizas.id_agente || '-'}</TableCell>
          <TableCell>
            <Badge variant="danger">{item.polizas.estado}</Badge>
          </TableCell>
        </TableRow>
      ));
    } else if (selectedTab.key === 'active-policies') {
      return (currentData as Poliza[]).map((poliza) => (
        <TableRow key={poliza.nro_poliza}>
          <TableCell>{poliza.nro_poliza}</TableCell>
          <TableCell>{poliza.id_cliente || '-'}</TableCell>
          <TableCell>
            <Badge variant={getTipoVariant(poliza.tipo)}>
              {poliza.tipo}
            </Badge>
          </TableCell>
          <TableCell>{poliza.fecha_inicio}</TableCell>
          <TableCell>{poliza.fecha_vencimiento || poliza.fecha_fin || '-'}</TableCell>
          <TableCell>${(poliza.prima_mensual || poliza.prima || 0).toLocaleString()}</TableCell>
          <TableCell>${(poliza.cobertura_total || 0).toLocaleString()}</TableCell>
          <TableCell>{poliza.id_agente || '-'}</TableCell>
          <TableCell>
            <Badge variant="success">{poliza.estado}</Badge>
          </TableCell>
        </TableRow>
      ));
    } else {
      return (currentData as PolizaSuspendida[]).map((item, index) => (
        <TableRow key={`${item.polizas.nro_poliza}-${index}`}>
          <TableCell>{item.polizas.nro_poliza}</TableCell>
          <TableCell>
            <Badge variant={item.activo === 'True' ? 'success' : 'danger'}>
              {item.activo === 'True' ? 'Activo' : 'Inactivo'}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant={getTipoVariant(item.polizas.tipo)}>
              {item.polizas.tipo}
            </Badge>
          </TableCell>
          <TableCell>{item.polizas.fecha_inicio}</TableCell>
          <TableCell>{item.polizas.fecha_fin || '-'}</TableCell>
          <TableCell>${(item.polizas.prima_mensual || 0).toLocaleString()}</TableCell>
          <TableCell>${(item.polizas.cobertura_total || 0).toLocaleString()}</TableCell>
          <TableCell>{item.polizas.id_agente || '-'}</TableCell>
          <TableCell>
            <Badge variant="warning">{item.polizas.estado}</Badge>
          </TableCell>
        </TableRow>
      ));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pólizas</h1>
        <p className="text-gray-500 mt-1">Gestión de pólizas de seguros</p>
      </div>

      <Tabs options={tabs} selected={selectedTab} onSelect={handleTabSelect} />

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTab.key === 'expired-policies'
              ? 'Pólizas Vencidas con Nombre del Cliente'
              : selectedTab.key === 'active-policies' 
                ? 'Pólizas Activas Ordenadas por Fecha de Inicio'
                : 'Pólizas Suspendidas con Estado del Cliente'
            }
          </CardTitle>
          <CardDescription>
            {selectedTab.key === 'expired-policies'
              ? 'Listado de pólizas vencidas con información del cliente asociado'
              : selectedTab.key === 'active-policies'
                ? 'Vista de todas las pólizas activas ordenadas por fecha de inicio'
                : 'Pólizas suspendidas mostrando el estado activo/inactivo del cliente'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {renderTableHeaders()}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="animate-pulse">Cargando datos...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                renderTableContent()
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
