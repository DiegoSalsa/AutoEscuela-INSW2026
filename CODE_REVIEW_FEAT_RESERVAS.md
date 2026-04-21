# Code Review: Rama `feat/reservas` → Merge a `main`

## Resumen Ejecutivo

Tu compañero agregó **1 commit** (`a5eb034`) con un módulo de creación de reservas. El enfoque general es **correcto y bien pensado** (transacciones serializables, middleware de validación como capa separada, router index centralizado). Sin embargo, se detectaron **problemas de calidad** que conviene corregir **antes** del merge.

---

## 1. Análisis de Calidad — Hallazgos

### 🔴 Problemas Críticos

#### 1.1 Falta validar que los IDs existan en la DB
**Archivo:** `backend/validations/reservasValidations.js`

El middleware valida presencia de campos e integridad temporal, pero **nunca verifica que los IDs sean enteros positivos ni que existan como registros reales**. Si alguien envía `{ estudianteId: 99999 }`, PostgreSQL lanza un error de FK críptico.

#### 1.2 No se valida solapamiento del ESTUDIANTE
**Archivo:** `backend/services/reservasService.js` (líneas 13-17)

La query de solapamiento solo verifica instructor y vehículo, pero **un estudiante podría tener dos reservas al mismo tiempo**.

#### 1.3 `nodemon` como dependencia de producción
**Archivo:** `backend/package.json`

`nodemon` se agregó en `dependencies` en vez de `devDependencies`.

### 🟡 Problemas Moderados

- **1.4** ROLLBACK doble cuando se detecta solapamiento (el catch ya hace ROLLBACK)
- **1.5** No se valida que `fechaInicio` sea en el futuro
- **1.6** Falta validación de tipos (strings vs integers)
- **1.7** Archivos sin newline final

### 🟢 Aspectos Positivos

- Transacción SERIALIZABLE (máximo aislamiento)
- Manejo de error `40001` (serialization failure)
- Separación Controller → Service
- Middleware de validación como capa separada
- Router index centralizado
- Código HTTP 409 para conflictos

---

## 2. Estructura de Carpetas Propuesta

### Actual (feat/reservas):
```
backend/
├── controllers/
├── db/
├── routes/
├── seeders/
├── services/        ← NUEVO
├── validations/     ← NUEVO
├── server.js
└── package.json
```

### Propuesta profesional:
```
backend/
├── src/
│   ├── config/db.js
│   ├── controllers/
│   ├── middlewares/
│   │   ├── errorHandler.js
│   │   └── validations/
│   ├── routes/
│   └── services/
├── seeders/
├── server.js
├── .env.example
└── package.json
```

---

## 3. Guía de Merge

```bash
# Paso 1: Traer la rama
git checkout main
git pull origin main
git fetch origin feat/reservas

# Paso 2: Rama temporal de prueba
git checkout -b test/merge-reservas
git merge origin/feat/reservas

# Paso 3: Verificar
cd backend && npm install && npm run dev

# Paso 4: Si hay conflictos en server.js, quedarse con la versión de feat/reservas
git add backend/server.js
git commit -m "fix: resolver conflicto merge server.js"

# Paso 5: Merge real
git checkout main
git merge origin/feat/reservas
git push origin main

# Paso 6: Limpiar
git branch -d test/merge-reservas
```
