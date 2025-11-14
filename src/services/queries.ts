// API Base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Types for database entities
export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  activo: string;
  polizas?: Poliza[];
  vehiculos?: Vehiculo[];
  polizas_vigentes?: Poliza[];
}

export type Accions = 'create' | 'update' | 'delete';

export interface Poliza {
  nro_poliza: string;
  id_cliente?: number;
  tipo: string;
  fecha_inicio: string;
  fecha_fin?: string;
  fecha_vencimiento?: string;
  prima?: number;
  prima_mensual?: number;
  estado: string;
  cobertura?: string;
  cobertura_total?: number;
  id_agente?: number | string;
}

export interface Vehiculo {
  _id?: string;
  id_vehiculo?: number;
  id_cliente?: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  nro_chasis?: string;
  asegurado: string;
}

export interface Agente {
  id_agente: number;
  nombre: string;
  apellido: string;
  matricula: string;
  telefono: string;
  email: string;
  zona: string;
  activo: string;
}

export interface Siniestro {
  id_siniestro: number;
  nro_poliza: string;
  fecha: string;
  tipo: string;
  monto_estimado: number;
  descripcion: string;
  estado: string;
  cliente?: Cliente;
}

export interface SiniestroAbierto extends Siniestro {
  cliente: Cliente;
}

export interface ClienteMultiVehiculo {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  activo: string;
  cantidad_vehiculos_asegurados?: number;
}

export interface AgenteConSiniestros {
  id_agente: number;
  nombre: string;
  apellido: string;
  matricula: string;
  email: string;
  telefono?: string;
  zona: string;
  activo: string;
  cantidad_siniestros: number;
  cantidad_polizas: number;
}

export interface AgenteConPolizas {
  id_agente: number;
  nombre: string;
  apellido: string;
  matricula: string;
  telefono: string;
  email: string;
  zona: string;
  activo: string;
  cantidad_polizas: number;
}

export interface ClienteSinPolizasActivas {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  activo: string;
}

export interface ClienteTopCobertura {
  id_cliente: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  ciudad: string;
  provincia: string;
  cobertura_total: number;
}

export interface VehiculoConCliente extends Cliente {
  vehiculo: Vehiculo;
  poliza: Poliza;
}

export interface PolizaVencida {
  nombre: string;
  apellido: string;
  polizas: Poliza;
}

export interface PolizaSuspendida {
  activo: string;
  polizas: Poliza;
}

// Query Service class that fetches data from the backend API
class QueryService {
  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  // Query: Todos los clientes
  async getAllClients(): Promise<Cliente[]> {
    return this.fetchData<Cliente[]>('/clients');
  }

  // AMB queries clientes
  async modifyClient(action: Accions, client: Cliente) {
    let method: string;
    let endpoint = '/clients';
    switch (action) {
      case 'create':
        method = 'POST';
        break;
      case 'update':
        method = 'PUT';
        endpoint += `/${client.id_cliente}`;
        break;
      case 'delete':
        method = 'DELETE';
        endpoint += `/${client.id_cliente}`;
        break;
      default:
        throw new Error('Invalid action');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify(client) : null,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error performing ${action} on client:`, error);
      throw error;
    }
  }

  // Query 1: Clientes activos con pólizas vigentes
  async getClientesActivosConPolizas(): Promise<Cliente[]> {
    return this.fetchData<Cliente[]>('/clients/active-with-policies');
  }

  // Query 2: Siniestros abiertos con tipo, monto y cliente afectado
  async getSiniestrosAbiertos(): Promise<SiniestroAbierto[]> {
    return this.fetchData<SiniestroAbierto[]>('/claims/open-claims');
  }

  // Query 3: Vehículos asegurados con cliente y póliza
  async getVehiculosAsegurados(): Promise<VehiculoConCliente[]> {
    return this.fetchData<VehiculoConCliente[]>('/clients/insured-vehicles');
  }

  // Query 4: Clientes sin pólizas activas
  async getClientesSinPolizasActivas(): Promise<ClienteSinPolizasActivas[]> {
    return this.fetchData<ClienteSinPolizasActivas[]>('/clients/without-active-policies');
  }

  // Query 5: Agentes activos con cantidad de pólizas asignadas
  async getAgentesActivosConPolizas(): Promise<AgenteConPolizas[]> {
    return this.fetchData<AgenteConPolizas[]>('/agents/active-with-policies');
  }

  // Query 6: Pólizas vencidas con nombre del cliente
  async getPolizasVencidas(): Promise<PolizaVencida[]> {
    return this.fetchData<PolizaVencida[]>('/clients/expired-policies');
  }

  // Query 7: Top 10 clientes por cobertura total
  async getClientesTopCobertura(): Promise<ClienteTopCobertura[]> {
    return this.fetchData<ClienteTopCobertura[]>('/clients/top-coverage');
  }

  // Query 8: Siniestros tipo "Accidente" del último año
  async getSiniestrosAccidentes(): Promise<Siniestro[]> {
    return this.fetchData<Siniestro[]>('/claims/accidents-last-year');
  }

  // Query 9: Vista de pólizas activas ordenadas por fecha de inicio
  async getPolizasActivasOrdenadas(): Promise<Poliza[]> {
    return this.fetchData<Poliza[]>('/policies/active-ordered');
  }

  // Query 10: Pólizas suspendidas con estado del cliente
  async getPolizasSuspendidas(): Promise<PolizaSuspendida[]> {
    return this.fetchData<PolizaSuspendida[]>('/clients/suspended-policies');
  }

  // Query 11: Clientes con más de un vehículo asegurado (Redis)
  async getClientesMultiplesVehiculos(): Promise<ClienteMultiVehiculo[]> {
    return this.fetchData<ClienteMultiVehiculo[]>('/clients/multiple-vehicles');
  }

  // Query 12: Agentes y cantidad de siniestros asociados (Redis)
  async getAgentesConSiniestros(): Promise<AgenteConSiniestros[]> {
    return this.fetchData<AgenteConSiniestros[]>('/agents/with-sinisters');
  }

  // Generic methods
  async getAllClientes(): Promise<Cliente[]> {
    return this.fetchData<Cliente[]>('/clients');
  }

  async getAllAgentes(): Promise<Agente[]> {
    return this.fetchData<Agente[]>('/agents');
  }

  async getAllSiniestros(): Promise<Siniestro[]> {
    return this.fetchData<Siniestro[]>('/claims');
  }
}

// Export singleton instance
export const queryService = new QueryService();
