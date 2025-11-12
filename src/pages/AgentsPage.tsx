import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { queryService, Agente } from '@/services/queries';

export const AgentsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Agente[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await queryService.getAllAgentes();
      setData(result || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Listado de Agentes</CardTitle>
          <CardDescription>Todos los agentes registrados en el sistema</CardDescription>
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
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="animate-pulse">Cargando datos...</div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No hay datos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((agente) => (
                  <TableRow key={agente.id_agente}>
                    <TableCell>{agente.id_agente}</TableCell>
                    <TableCell>{agente.nombre} {agente.apellido}</TableCell>
                    <TableCell>{agente.matricula}</TableCell>
                    <TableCell>{agente.telefono}</TableCell>
                    <TableCell>{agente.email}</TableCell>
                    <TableCell>{agente.zona}</TableCell>
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
