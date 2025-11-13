# 📘 Sistema de Gestión de Aseguradoras  
### Trabajo Práctico – Base de Datos II (2025)


## 📌 Descripción
Este proyecto implementa un sistema Backoffice para una compañía de seguros utilizando una **arquitectura poliglota con bases NoSQL**.  

# 🚀 Cómo ejecutar el proyecto

## 1️⃣ Requisitos previos
Necesitás tener instalado:

- Docker & Docker Compose (o Docker Desktop)
- Node.js 18+ y npm (si vas a ejecutar queries localmente fuera del contenedor)
- VS Code con la extensión "Dev Containers" / Codespaces


## 2 (modo Devcontainer / Codespaces) 
1. Abrir el repo en VS Code y elegir "Reopen in Container" o abrir en Codespaces. El devcontainer usa `.devcontainer/Dockerfile`.


## 3 Ejecución de las Queries

1. Abrir un shell en el contenedor `workspace`

2. Dentro del contenedor, instalar dependencias (si no están instaladas) y ejecutar la query correspondiente, siendo n el número de query:

```bash
cd /workspace
npm install    # solo la primera vez o si cambian dependencias
npm run query1 # ejecutar la query 1
```

