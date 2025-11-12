import React, { useState, useEffect } from 'react';
import Tabs, { TabsElement } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, Cliente, VehiculoConCliente, PolizaVencida, PolizaSuspendida } from '@/services/queries';

type ClientQueryType = 'active-policies' | 'insured-vehicles' | 'expired-policies' | 'suspended-policies';

export const ClientsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabsElement>({ key: 'active-policies', label: 'Pólizas Vigentes' });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const tabs: TabsElement[] = [
    { key: 'active-policies', label: 'Pólizas Vigentes' },
    { key: 'insured-vehicles', label: 'Vehículos Asegurados' },
    { key: 'expired-policies', label: 'Pólizas Vencidas' },
    { key: 'suspended-policies', label: 'Pólizas Suspendidas' },
  ];

  useEffect(() => {
    fetchData(selectedTab.key as ClientQueryType);
  }, [selectedTab]);

  const fetchData = async (queryType: ClientQueryType) => {
    setLoading(true);
    try {
      let result;
      switch (queryType) {
        case 'active-policies':
          result = await queryService.getClientesActivosConPolizas();
          break;
        case 'insured-vehicles':
          result = await queryService.getVehiculosAsegurados();
          break;
        case 'expired-policies':
          result = await queryService.getPolizasVencidas();
          break;
        case 'suspended-policies':
          result = await queryService.getPolizasSuspendidas();
          break;
      }
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const renderTableContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8">
            <div className="animate-pulse">Cargando datos...</div>
          </TableCell>
        </TableRow>
      );
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
            No hay datos disponibles
          </TableCell>
        </TableRow>
      );
    }

    switch (selectedTab.key) {
      case 'active-policies':
        return currentData.map((cliente: Cliente, idx) => (
          <TableRow key={idx}>
            <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
            <TableCell>{cliente.dni}</TableCell>
            <TableCell>{cliente.email}</TableCell>
            <TableCell>{cliente.ciudad}, {cliente.provincia}</TableCell>
            <TableCell>
              <Badge variant={cliente.activo === 'True' ? 'success' : 'danger'}>
                {cliente.activo === 'True' ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>
              {cliente.polizas_vigentes?.length || 0} pólizas
            </TableCell>
          </TableRow>
        ));

      case 'insured-vehicles':
        return currentData.map((item: VehiculoConCliente, idx) => (
          <TableRow key={idx}>
            <TableCell>{item.nombre} {item.apellido}</TableCell>
            <TableCell>{item.vehiculo.patente}</TableCell>
            <TableCell>{item.vehiculo.marca} {item.vehiculo.modelo}</TableCell>
            <TableCell>{item.vehiculo.anio}</TableCell>
            <TableCell>{item.poliza.nro_poliza}</TableCell>
            <TableCell>{item.poliza.tipo}</TableCell>
            <TableCell>
              <Badge variant="success">Asegurado</Badge>
            </TableCell>
          </TableRow>
        ));

      case 'expired-policies':
        return currentData.map((item: PolizaVencida, idx) => (
          <TableRow key={idx}>
            <TableCell>{item.nombre} {item.apellido}</TableCell>
            <TableCell>{item.polizas.nro_poliza}</TableCell>
            <TableCell>{item.polizas.tipo}</TableCell>
            <TableCell>{item.polizas.fecha_vencimiento}</TableCell>
            <TableCell>${item.polizas.prima.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant="danger">Vencida</Badge>
            </TableCell>
          </TableRow>
        ));

      case 'suspended-policies':
        return currentData.map((item: PolizaSuspendida, idx) => (
          <TableRow key={idx}>
            <TableCell>{item.polizas.nro_poliza}</TableCell>
            <TableCell>{item.polizas.tipo}</TableCell>
            <TableCell>{item.polizas.fecha_inicio}</TableCell>
            <TableCell>${item.polizas.prima.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={item.activo === 'True' ? 'success' : 'danger'}>
                {item.activo === 'True' ? 'Cliente Activo' : 'Cliente Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="warning">Suspendida</Badge>
            </TableCell>
          </TableRow>
        ));

      default:
        return null;
    }
  };

  const renderTableHeaders = () => {
    switch (selectedTab.key) {
      case 'active-policies':
        return (
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Pólizas</TableHead>
          </TableRow>
        );
      case 'insured-vehicles':
        return (
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Patente</TableHead>
            <TableHead>Vehículo</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Nro. Póliza</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        );
      case 'expired-policies':
        return (
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Nro. Póliza</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Prima</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        );
      case 'suspended-policies':
        return (
          <TableRow>
            <TableHead>Nro. Póliza</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Prima</TableHead>
            <TableHead>Estado Cliente</TableHead>
            <TableHead>Estado Póliza</TableHead>
          </TableRow>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (selectedTab.key) {
      case 'active-policies':
        return 'Clientes Activos con Pólizas Vigentes';
      case 'insured-vehicles':
        return 'Vehículos Asegurados';
      case 'expired-policies':
        return 'Pólizas Vencidas';
      case 'suspended-policies':
        return 'Pólizas Suspendidas';
      default:
        return 'Clientes';
    }
  };

  const getDescription = () => {
    switch (selectedTab.key) {
      case 'active-policies':
        return 'Listado de clientes activos que tienen al menos una póliza vigente';
      case 'insured-vehicles':
        return 'Vehículos asegurados con información del cliente y póliza asociada';
      case 'expired-policies':
        return 'Pólizas vencidas con información del cliente';
      case 'suspended-policies':
        return 'Pólizas suspendidas con estado del cliente';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 mt-1">Gestión de clientes y pólizas</p>
      </div>

      <Tabs options={tabs} selected={selectedTab} onSelect={handleTabSelect} />

      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {renderTableHeaders()}
            </TableHeader>
            <TableBody>
              {renderTableContent()}
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
