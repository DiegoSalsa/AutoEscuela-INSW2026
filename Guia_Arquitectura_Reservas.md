# Informe de Arquitectura y Explicación de Código: Sistema de Reservas

Este documento contiene la explicación detallada de cómo está construido el sistema de reservas. Está diseñado para que sirva como material de estudio y apoyo para presentaciones, permitiendo defender la lógica del código tanto a nivel general como línea por línea.

---

## 1. Arquitectura General del Frontend (React)

En el desarrollo web moderno con React, la regla de oro es **"Divide y vencerás"**. Si pusiéramos todo el código de la pantalla de reservas en un solo archivo, tendríamos miles de líneas imposibles de leer o mantener. Por eso dividimos el código en tres conceptos principales:

### La carpeta `api` (ej. `reservas.js`)
*   **¿Para qué sirve?** Es el **puente de comunicación** entre el Frontend (lo que ve el usuario) y el Backend (tu servidor y base de datos). 
*   **¿Qué hace?** Aquí guardamos todas las funciones que hacen las peticiones a internet (`fetch` o `axios`). Ej: *"Oye servidor, guárdame esta nueva reserva"*.
*   **¿Por qué lo hicimos así?** Si la dirección de tu servidor cambia, solo modificas este archivo en lugar de buscar por todos los componentes visuales dónde pusiste la URL.

### La carpeta `components` (Los Componentes Visuales)
*   **¿Para qué sirve?** En React, un componente es como una **pieza de Lego**. Cada archivo `.jsx` es una pieza visual y su archivo `.css` es su diseño.
*   **Componentes principales:**
    1.  **`Calendario.jsx`**: Donde el alumno hace clic para **elegir el día** de su clase.
    2.  **`SelectorRecursos.jsx`**: Donde el usuario elige **qué quiere reservar** (vehículo, instructor).
    3.  **`BloqueHorarios.jsx`**: Muestra los **cuadritos con las horas disponibles** para que haga clic en la hora que le acomoda.
    4.  **`PanelDetalles.jsx`**: El **resumen final** con el botón grande de "Confirmar Reserva".

### La carpeta `hooks` (ej. `useSocket.js`)
*   **¿Para qué sirve?** Un "Hook" permite extraer lógica compleja y encapsularla en un archivo para que cualquier componente la pueda usar fácilmente.
*   **¿Por qué lo hicimos así?** La lógica de mantener una conexión en vivo (WebSockets) es compleja. En lugar de ensuciar nuestros componentes visuales con ese código, lo escondimos en el hook. Así, cualquier pantalla que necesite actualizarse en vivo, solo llama al Hook y mágicamente obtiene ese "superpoder".

---

## 2. Explicación Línea por Línea: Frontend

### A) El Hook de Tiempo Real (`useSocket.js`)
Si te preguntan: *"¿Cómo implementaste el tiempo real para evitar que dos usuarios reserven la misma hora?"*

```javascript
1:  import { useEffect, useState } from 'react';
2:  import { io } from 'socket.io-client';
3: 
4:  const SOCKET_URL = 'http://localhost:3000';
5: 
6:  export function useSocket(sedeId) {
7:    const [socket, setSocket] = useState(null);
8:    const [isConnected, setIsConnected] = useState(false);
9: 
10:   useEffect(() => {
11:     // Inicializar conexión
12:     const newSocket = io(SOCKET_URL);
13:     setSocket(newSocket);
```
*   **Líneas 1-2**: Importamos herramientas de React (`useEffect`, `useState`) y la librería `socket.io-client` para la conexión en vivo.
*   **Línea 6**: Creamos la función. Recibe el `sedeId` porque no queremos escuchar las reservas de todo el país, solo las de la sede seleccionada.
*   **Líneas 7-8**: Creamos variables de memoria (estados) para guardar la conexión y saber si estamos conectados.
*   **Línea 10**: `useEffect` le dice a React: *"Apenas el usuario entre a la pantalla, ejecuta este bloque de código"*.
*   **Línea 12**: Se establece la conexión real con el servidor.

```javascript
15:     newSocket.on('connect', () => {
16:       setIsConnected(true);
17:       // Unirse al canal de la sede si existe
18:       if (sedeId) {
19:         newSocket.emit('join:sede', sedeId);
20:       }
21:     });
```
*   **Líneas 15-20**: Cuando el servidor responde *"estás conectado"*, emitimos el evento `'join:sede'`. Es como entrar a un grupo de chat específico de esa sede para recibir solo sus notificaciones.

> **Líneas de Defensa Críticas (27-29): Limpieza de Memoria**
> ```javascript
>     return () => {
>       newSocket.disconnect();
>     };
> ```
> Si te preguntan sobre optimización, debes mencionar esto: *"Esta función de limpieza asegura que si el usuario cierra la pestaña o cambia de página, la conexión se corta automáticamente para no dejar conexiones fantasmas y saturar la memoria del servidor"*.

### B) El Orquestador Principal (`App.jsx`)
Este archivo une todas las piezas de Lego.

```javascript
14:   const [selecciones, setSelecciones] = useState({
15:     sedeId: 1, 
16:     estudianteId: null,
17:     instructorId: null,
18:     vehiculoId: null,
19:   });
...
30:   const { socket } = useSocket(selecciones.sedeId);
```
*   **Líneas 14-19**: Declaramos la memoria de la pantalla. Aquí guardamos lo que el usuario va seleccionando.
*   **Línea 30**: Llamamos al Hook explicado arriba. Con esto, la pantalla ya tiene conexión en vivo.

```javascript
33:   useEffect(() => {
34:     const fetchOcupados = async () => {
35:       if (!fecha || !selecciones.sedeId) return;
36:       try {
37:         const data = await getHorariosOcupados(fecha, selecciones.sedeId, selecciones.instructorId, selecciones.vehiculoId);
38:         setHorariosOcupados(data);
...
```
*   **Líneas 33-38**: Es automático. Cada vez que el usuario cambia la fecha o el vehículo (verificado por la línea 51), la aplicación va al backend y pide la lista actualizada de horas ocupadas.

```javascript
88:     // Formatear ISO strings combinando fecha y hora
89:     // Enviar la fecha en formato ISO pero como HORA LOCAL (sin la Z de UTC)
90:     // Esto evita que 17:00 hrs local se convierta en 13:00 hrs en el servidor
91:     const dateStr = format(fecha, 'yyyy-MM-dd');
92:     const fechaInicio = `${dateStr}T${hora.horaInicio}:00`;
```
*   **Líneas 88-92**: **Detalle Técnico Importante**. Formateamos la fecha manualmente sin usar la "Z" del estándar UTC. Esto previene el clásico bug donde el backend guarda la reserva con horas de diferencia por la zona horaria del país.

---

## 3. Explicación Línea por Línea: Backend

### A) El Motor de Arranque (`server.js`)
Si te preguntan: *"Explícame cómo arranca tu backend"*:

```javascript
1:  require('dotenv').config();
2:  const express = require('express');
3:  const http = require('http');
4:  const cors = require('cors');
...
11: const app = express();
12: const PORT = process.env.PORT || 3000;
13: 
14: // Crear servidor HTTP (requerido por Socket.io)
15: const server = http.createServer(app);
```
*   **Líneas 1-4**: Importamos librerías: Express (para web), HTTP (para englobar a express) y CORS (seguridad).
*   **Líneas 11-15**: Express por defecto no soporta Sockets. Aquí envolvemos Express adentro de un servidor `HTTP` puro de Node.js para que los webSockets y el tráfico web usen el mismo puerto.

```javascript
17: // Inicializar Socket.io
18: initSocket(server);
...
31: // inicializar TypeORM y luego levantar el servidor
32: AppDataSource.initialize()
33:   .then(async () => {
```
*   **Línea 18**: Le inyectamos la lógica de tiempo real al servidor HTTP.
*   **Línea 32**: **Orden Lógico Crítico**. Primero nos conectamos a la Base de Datos PostgreSQL con TypeORM. NO levantamos el servidor web hasta que la base de datos responda con éxito.

```javascript
37:     await initMailer();
38: 
39:     // Iniciar tareas programadas (cron jobs)
40:     iniciarScheduler();
41: 
42:     server.listen(PORT, () => {
43:       console.log(`🚗 Servidor corriendo en http://localhost:${PORT}`);
```
*   **Líneas 37-40**: Una vez que la DB responde, encendemos el sistema de Correos Automáticos y las Tareas Programadas (cron jobs).
*   **Línea 42**: Finalmente, abrimos el puerto y el servidor comienza a aceptar peticiones.

### B) Transacciones Concurrentes (`reservas.Service.js`)

**Pregunta de Defensa:** "¿Cómo evitan que se reserve un vehículo dos veces a la misma hora en el Backend?"

**Respuesta esperada:**
*"En nuestro servicio utilizamos **Transacciones de Base de Datos (con nivel SERIALIZABLE)** a través de TypeORM (`QueryRunner`). Cuando llega una petición, bloqueamos las filas involucradas. Revisamos si hay topes de horario. Si todo está libre, guardamos la reserva. Si un segundo usuario hace clic al mismo milisegundo exacto, la base de datos lo pone en fila de espera por el bloqueo transaccional. Cuando es el turno del segundo usuario, el sistema ya verá la hora como ocupada y rechazará la segunda reserva de forma segura, evitando los choques."*
