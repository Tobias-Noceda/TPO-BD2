import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, VehiculoConCliente } from '@/services/queries';

export const VehiclesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VehiculoConCliente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await queryService.getVehiculosAsegurados();
      setData(result || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const getMarcaVariant = (marca: string) => {
    switch (marca.toLowerCase()) {
      case 'toyota':
        return 'success';
      case 'volkswagen':
        return 'info';
      case 'chevrolet':
        return 'warning';
      case 'ford':
        return 'danger';
      case 'honda':
        return 'success';
      case 'audi':
        return 'info';
      case 'peugeot':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vehículos</h1>
        <p className="text-gray-500 mt-1">Gestión de vehículos asegurados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehículos Asegurados con Cliente y Póliza</CardTitle>
          <CardDescription>
            Listado completo de vehículos asegurados con información del cliente y póliza activa asociada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patente</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Nro. Chasis</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Nro. Póliza</TableHead>
                <TableHead>Estado Póliza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="animate-pulse">Cargando datos...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item) => (
                  <TableRow key={item.vehiculo._id}>
                    <TableCell className="font-medium">{item.vehiculo.patente}</TableCell>
                    <TableCell>
                      <Badge variant={getMarcaVariant(item.vehiculo.marca)}>
                        {item.vehiculo.marca}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.vehiculo.modelo}</TableCell>
                    <TableCell>{item.vehiculo.anio}</TableCell>
                    <TableCell>{item.vehiculo.nro_chasis}</TableCell>
                    <TableCell>{item.nombre} {item.apellido}</TableCell>
                    <TableCell>{item.dni}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.email}>
                      {item.email}
                    </TableCell>
                    <TableCell>{item.ciudad}</TableCell>
                    <TableCell>{item.poliza.nro_poliza}</TableCell>
                    <TableCell>
                      <Badge variant={item.poliza.estado === 'Activa' ? 'success' : 'warning'}>
                        {item.poliza.estado}
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
