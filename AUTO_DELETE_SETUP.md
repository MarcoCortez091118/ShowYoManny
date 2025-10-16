# Auto-Delete History Setup

## Resumen

Los elementos eliminados o expirados se mantienen en la tabla `content_history` por **24 horas** antes de ser eliminados permanentemente de la base de datos.

## Cambios Implementados

### 1. Base de Datos (Supabase)

- **Nuevo campo**: `auto_delete_at` en tabla `content_history`
  - Se establece automáticamente a `deleted_at + 24 hours`
  - Indica cuándo el registro debe eliminarse permanentemente

- **Función automática**: `auto_delete_old_history()`
  - Elimina registros de `content_history` donde `auto_delete_at < now()`
  - Ejecutable mediante SQL: `SELECT auto_delete_old_history();`

- **Trigger actualizado**: `archive_queue_item_before_delete()`
  - Ahora establece `auto_delete_at` automáticamente al archivar

### 2. Edge Function

- **Función**: `cleanup-old-history`
- **Propósito**: Ejecutar limpieza automática de registros antiguos
- **URL**: `https://[PROYECTO].supabase.co/functions/v1/cleanup-old-history`

### 3. Interfaz de Usuario

- **AdminHistory actualizado**:
  - Muestra tiempo restante antes de eliminación permanente
  - Badge naranja con temporizador: "⏰ 23h 45m remaining"
  - Se actualiza automáticamente cada minuto
  - Descripción clara: "Deleted items are kept for 24 hours before permanent removal"

## Configuración Recomendada

### Opción 1: Cron Job Externo (Recomendado)

Configurar un servicio externo (como cron-job.org, EasyCron, etc.) para llamar la Edge Function cada hora:

```bash
# Llamada HTTP GET cada hora
curl https://[PROYECTO].supabase.co/functions/v1/cleanup-old-history
```

**Ventajas**:
- Simple y confiable
- No requiere infraestructura adicional
- Gratis con servicios como cron-job.org

### Opción 2: Supabase pg_cron (Si está disponible)

Si tu plan de Supabase incluye pg_cron:

```sql
-- Ejecutar limpieza cada hora
SELECT cron.schedule(
  'cleanup-old-history',
  '0 * * * *',  -- Cada hora en punto
  $$SELECT auto_delete_old_history();$$
);
```

### Opción 3: Servicio de Tarea Programada

Usar un servicio como:
- GitHub Actions (con workflow programado)
- Vercel Cron Jobs
- AWS Lambda con EventBridge
- Google Cloud Scheduler

## Verificación

Para verificar que todo funciona correctamente:

1. **Ver registros pendientes de eliminación**:
```sql
SELECT id, title, deleted_at, auto_delete_at,
       auto_delete_at - now() as time_remaining
FROM content_history
WHERE auto_delete_at IS NOT NULL
ORDER BY auto_delete_at ASC;
```

2. **Ejecutar limpieza manualmente**:
```sql
SELECT auto_delete_old_history();
```

3. **Verificar ejecución de Edge Function**:
```bash
curl https://[PROYECTO].supabase.co/functions/v1/cleanup-old-history
```

## Notas Importantes

- Los registros se mantienen exactamente **24 horas** después de ser eliminados
- La limpieza NO es instantánea, depende de la frecuencia de ejecución configurada
- Se recomienda ejecutar la limpieza cada hora para mantener la base de datos optimizada
- Los usuarios ven el temporizador en tiempo real en la interfaz AdminHistory
- No se requiere configuración manual de secrets en Supabase (ya están configurados)

## Monitoreo

Recomendaciones para monitorear el sistema:

1. Revisar logs de Supabase Edge Functions
2. Verificar que `content_history` no crezca indefinidamente
3. Asegurar que registros con `auto_delete_at` en el pasado se eliminen
4. Monitorear el espacio de almacenamiento en la base de datos
