import React, { useState, useEffect } from 'react';
import Tabs, { TabsElement } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, Cliente, ClienteMultiVehiculo, ClienteSinPolizasActivas } from '@/services/queries';

type ClientQueryType = 'all' | 'active-clients' | 'without-active-policies' | 'top-coverage' | 'multiple-vehicles';

export const ClientsPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabsElement>({ key: 'all', label: 'Todos los Clientes' });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const tabs: TabsElement[] = [
    { key: 'all', label: 'Todos los Clientes' },
    { key: 'active-clients', label: 'Clientes Activos' },
    { key: 'without-active-policies', label: 'Sin Pólizas Activas' },
    { key: 'top-coverage', label: 'Top Clientes por Cobertura' },
    { key: 'multiple-vehicles', label: 'Múltiples Vehículos' },
  ];

  useEffect(() => {
    fetchData(selectedTab.key as ClientQueryType);
  }, [selectedTab]);

  const fetchData = async (queryType: ClientQueryType) => {
    setLoading(true);
    try {
      let result;
      switch (queryType) {
        case 'all':
          result = await queryService.getAllClients();
          break;
        case 'active-clients':
          result = await queryService.getClientesActivosConPolizas();
          break;
        case 'without-active-policies':
          result = await queryService.getClientesSinPolizasActivas();
          break;
        case 'top-coverage':
          const allResults = await queryService.getClientesTopCobertura();
          result = allResults.slice(0, 10); // Only top 10
          break;
        case 'multiple-vehicles':
          result = await queryService.getClientesMultiplesVehiculos();
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
      case 'all':
        return currentData.map((cliente: Cliente, idx) => (
          <TableRow key={idx}>
            <TableCell>{cliente.id_cliente}</TableCell>
            <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
            <TableCell>{cliente.dni}</TableCell>
            <TableCell>{cliente.email}</TableCell>
            <TableCell>{cliente.telefono}</TableCell>
            <TableCell>{cliente.ciudad}, {cliente.provincia}</TableCell>
            <TableCell>
              <Badge variant={cliente.activo === 'True' ? 'success' : 'danger'}>
                {cliente.activo === 'True' ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
          </TableRow>
        ));

      case 'active-clients':
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

      case 'without-active-policies':
        return currentData.map((cliente: ClienteSinPolizasActivas, idx) => (
          <TableRow key={idx}>
            <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
            <TableCell>{cliente.dni}</TableCell>
            <TableCell>{cliente.email}</TableCell>
            <TableCell>{cliente.telefono}</TableCell>
            <TableCell>{cliente.ciudad}, {cliente.provincia}</TableCell>
            <TableCell>
              <Badge variant={cliente.activo === 'True' ? 'success' : 'danger'}>
                {cliente.activo === 'True' ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
          </TableRow>
        ));

      case 'top-coverage':
        return currentData.map((cliente: any, idx) => (
          <TableRow key={idx}>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{cliente.id_cliente}</TableCell>
            <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
            <TableCell>
              <Badge variant="success">${(cliente.total_cobertura || cliente.cobertura_total || 0).toLocaleString()}</Badge>
            </TableCell>
          </TableRow>
        ));

      case 'multiple-vehicles':
        return currentData.map((cliente: ClienteMultiVehiculo, idx) => (
          <TableRow key={idx}>
            <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
            <TableCell>{cliente.dni}</TableCell>
            <TableCell>{cliente.email}</TableCell>
            <TableCell>{cliente.telefono}</TableCell>
            <TableCell>{cliente.ciudad}, {cliente.provincia}</TableCell>
            <TableCell>
              <Badge variant={cliente.activo === 'True' ? 'success' : 'danger'}>
                {cliente.activo === 'True' ? 'Activo' : 'Inactivo'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="info">Redis</Badge>
            </TableCell>
          </TableRow>
        ));

      default:
        return null;
    }
  };

  const renderTableHeaders = () => {
    switch (selectedTab.key) {
      case 'all':
        return (
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        );
      case 'active-clients':
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
      case 'without-active-policies':
        return (
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        );
      case 'top-coverage':
        return (
          <TableRow>
            <TableHead>Ranking</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Cobertura Total</TableHead>
          </TableRow>
        );
      case 'multiple-vehicles':
        return (
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>DNI</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fuente</TableHead>
          </TableRow>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (selectedTab.key) {
      case 'all':
        return 'Todos los Clientes';
      case 'active-clients':
        return 'Clientes Activos';
      case 'without-active-policies':
        return 'Clientes Sin Pólizas Activas';
      case 'top-coverage':
        return 'Top Clientes por Cobertura';
      case 'multiple-vehicles':
        return 'Clientes con Múltiples Vehículos Asegurados (Redis)';
      default:
        return 'Clientes';
    }
  };

  const getDescription = () => {
    switch (selectedTab.key) {
      case 'all':
        return 'Listado completo de todos los clientes registrados en el sistema';
      case 'active-clients':
        return 'Listado de clientes activos que tienen al menos una póliza vigente (Query 1)';
      case 'without-active-policies':
        return 'Clientes que no tienen ninguna póliza activa (Query 4)';
      case 'top-coverage':
        return 'Top 10 clientes ordenados por cobertura total (Query 7)';
      case 'multiple-vehicles':
        return 'Clientes que poseen más de un vehículo asegurado (Query 11 - Redis)';
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

      <div className='flex-row h-fit w-full m-0 p-0 flex justify-between items-center'>
        <Tabs options={tabs} selected={selectedTab} onSelect={handleTabSelect} />
      </div>

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
