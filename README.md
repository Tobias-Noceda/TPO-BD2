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
1. Abrir el repo en VS Code y elegir "Reopen in Container" o abrir en Codespaces. El devcontainer usa `.devcontainer/Dockerfile`. Opcionalmente también se puede usar el Codepsace que trae Github. 


## 3 Ejecución de las Queries

1. Abrir un shell en el contenedor `workspace`

2. Dentro del contenedor, instalar dependencias (si no están instaladas) y ejecutar la query correspondiente, siendo n el número de query:

```bash
cd /workspace
npm install    # solo la primera vez o si cambian dependencias
npm run query1 # ejecutar la query 1
```

3. Si no funciona, con este comando:

```bash
npm run -s queryn --prefix /workspace # ejecutar la query n
```
4. Para la queries 13 en particular:
```bash
npm run -s query13 [-action] [-params] --prefix /workspace
```
por ejemplo: 

```bash
npm run -s query13 Add id_cliente=207 apellido=Perezito email=juancito@example.com  [-params] --prefix /workspace
```
donde se ha definido como obligatorios, los campos id_cliente, apellido, y email. Se le pueden agregar más campos nuevos donde dice params (pese a la arquitectura de MongoDB, para posibles escalamientos). 

```bash
npm run -s query13 Delete 207 --prefix /workspace
```
elimina el cliente con el usuario id_cliente 207. 

Para modificar uno o varios campos:
```bash
npm run -s query13 Modify 209 nombre=Juancito --prefix /workspace
```
5. Para la queries 14 en particular:
```bash
npm run -s query14 id_siniestro=9999 nro_poliza=POL1001 fecha=20/3/2025 --prefix /workspace
```

Agrega un siniestro con id 9999, número de póliza POL1001, y fecha=20/3/2025. Estos campos son de carácter obligatorio. Al resto de los campos, se los tomaron como opcional. 

Por último para la query 15 es análogo a la query 14, siendo los campos obligatorios los siguientes: nro_poliza, id_cliente, tipo, fecha_inicio, id_agente. 

