# Guía de Debug del Nuevo Sistema de Login

## Sistema Completamente Reconstruido

Se ha creado desde cero un nuevo sistema de autenticación simple, robusto y con logs detallados para identificar cualquier problema.

## Archivos Nuevos Creados

1. **`src/services/logger.ts`** - Sistema de logging centralizado
2. **`src/services/authService.ts`** - Servicio de autenticación simplificado
3. **`src/contexts/SimpleAuthContext.tsx`** - Contexto de autenticación nuevo
4. **`src/pages/SimpleAdminLogin.tsx`** - Página de login completamente nueva

## Archivos Actualizados

1. **`src/App.tsx`** - Ahora usa `SimpleAuthProvider` y `SimpleAdminLogin`
2. **`src/components/ProtectedRoute.tsx`** - Actualizado para usar el nuevo contexto

## Cómo Verificar los Logs

### Paso 1: Abrir la Consola del Navegador

1. Abre tu navegador (Chrome, Firefox, Edge, etc.)
2. Presiona `F12` o clic derecho → "Inspeccionar"
3. Ve a la pestaña **"Console"**

### Paso 2: Intentar Iniciar Sesión

1. Navega a `/admin-login`
2. Ingresa tus credenciales
3. Haz clic en "Sign In"

### Paso 3: Leer los Logs

Verás logs detallados como estos:

```
[2025-10-10T05:30:00.000Z] [AdminLoginPage] [INFO] Login page mounted { authLoading: false, hasUser: false, isAdmin: false }
[2025-10-10T05:30:05.000Z] [AdminLoginPage] [INFO] Login form submitted { email: "marco@showyo.app" }
[2025-10-10T05:30:05.000Z] [AdminLoginPage] [DEBUG] Form validation passed, calling signIn
[2025-10-10T05:30:05.000Z] [AuthContext] [INFO] Sign in requested { email: "marco@showyo.app" }
[2025-10-10T05:30:05.000Z] [AuthService] [INFO] Starting sign in process { email: "marco@showyo.app" }
[2025-10-10T05:30:05.000Z] [AuthService] [DEBUG] Step 1: Calling Supabase signInWithPassword
```

## Interpretación de Logs

### ✅ Login Exitoso

Deberías ver esta secuencia:

```
[AuthService] [INFO] Starting sign in process
[AuthService] [DEBUG] Step 1: Calling Supabase signInWithPassword
[AuthService] [INFO] Step 1 Success: Supabase session created
[AuthService] [DEBUG] Step 2: Fetching user data from database
[AuthService] [INFO] Step 2 Success: User data fetched
[AuthService] [INFO] Sign in completed successfully
[AuthContext] [INFO] Sign in successful, updating context
[AdminLoginPage] [INFO] Login successful, showing success toast
[AdminLoginPage] [INFO] Navigating to dashboard
```

### ❌ Error de Credenciales

```
[AuthService] [INFO] Starting sign in process
[AuthService] [DEBUG] Step 1: Calling Supabase signInWithPassword
[AuthService] [ERROR] Step 1 Failed: Supabase auth error { error: "Invalid login credentials" }
[AuthContext] [WARN] Sign in failed { error: "Invalid login credentials" }
[AdminLoginPage] [WARN] Login failed { error: "Invalid login credentials" }
```

### ❌ Error de Base de Datos

```
[AuthService] [INFO] Starting sign in process
[AuthService] [DEBUG] Step 1: Calling Supabase signInWithPassword
[AuthService] [INFO] Step 1 Success: Supabase session created
[AuthService] [DEBUG] Step 2: Fetching user data from database
[AuthService] [ERROR] Step 2 Failed: Database query error { error: "..." }
```

### ❌ Pantalla Congelada

Si la pantalla se queda en "Signing in..." busca en los logs:

1. **Si no ves ningún log después de "Starting sign in process":**
   - Problema de conexión a Supabase
   - Verifica las variables de entorno en `.env`
   - Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas

2. **Si ves logs pero se detiene en un paso:**
   - Identifica en qué paso se detiene (Step 1 o Step 2)
   - Lee el mensaje de error específico
   - El error dirá exactamente qué falló

## Características del Nuevo Sistema

### 1. Login Simplificado

- ✅ Sin dependencias complejas
- ✅ Lógica clara y lineal
- ✅ Manejo de errores en cada paso
- ✅ Logs en tiempo real

### 2. Detección de Problemas

- ✅ Contador de intentos fallidos
- ✅ Botón "Clear Sessions & Retry" después de 2 intentos
- ✅ Mensajes de error claros
- ✅ Indicador visual de carga

### 3. Logs Detallados

Cada componente tiene su propio logger:

- **AuthService** - Operaciones de autenticación
- **AuthContext** - Gestión de estado global
- **AdminLoginPage** - Interacciones del usuario

## Solución de Problemas Comunes

### Problema 1: Pantalla Congelada en "Signing in..."

**Causa:** El servicio de autenticación no responde o hay un error no manejado.

**Solución:**

1. Abre la consola (F12)
2. Busca el último log antes del congelamiento
3. Identifica el paso que falló
4. Si es Step 1: Problema con Supabase Auth
5. Si es Step 2: Problema con la base de datos

### Problema 2: Error "Invalid login credentials"

**Causa:** Email o contraseña incorrectos.

**Solución:**

1. Verifica las credenciales
2. Asegúrate de que el usuario existe en Supabase Auth
3. Verifica en la consola de Supabase: Authentication → Users

### Problema 3: Error después de login exitoso

**Causa:** El usuario no existe en la tabla `users`.

**Solución:**

1. El sistema debería funcionar con roles por defecto `['user']`
2. Verifica los logs para confirmar
3. Si necesitas rol de admin, actualiza la tabla `users`:

```sql
UPDATE users
SET roles = ARRAY['admin']
WHERE email = 'tu-email@showyo.app';
```

### Problema 4: Redirección infinita

**Causa:** El ProtectedRoute está redirigiendo al login constantemente.

**Solución:**

1. Abre la consola
2. Busca logs de "Auth context render"
3. Verifica que `hasUser: true` y `isAdmin: true`
4. Si son false, el usuario no tiene permisos de admin

## Comandos de Debug en Consola

Puedes ejecutar estos comandos en la consola del navegador:

### Ver todas las claves de localStorage

```javascript
Object.keys(localStorage).filter(k => k.startsWith('sb-'))
```

### Limpiar manualmente localStorage de Supabase

```javascript
Object.keys(localStorage)
  .filter(k => k.startsWith('sb-'))
  .forEach(k => localStorage.removeItem(k));
console.log('Supabase storage cleared');
```

### Verificar sesión actual

```javascript
// Esto lo manejará el logger automáticamente
// Solo observa los logs en consola
```

## Verificación de Variables de Entorno

Asegúrate de que tu archivo `.env` tenga estas variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### Verificar en el navegador:

Abre la consola y ejecuta:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

## Testing del Sistema

### Test 1: Login Normal

1. Ve a `/admin-login`
2. Ingresa credenciales válidas
3. Observa los logs en consola
4. Debes ver la secuencia completa de éxito
5. Debes ser redirigido a `/admin`

### Test 2: Credenciales Incorrectas

1. Ve a `/admin-login`
2. Ingresa credenciales inválidas
3. Debes ver un error claro
4. El botón debe desbloquearse
5. Puedes intentar de nuevo

### Test 3: Clear Sessions

1. Intenta login 2 veces con credenciales incorrectas
2. Debe aparecer el botón "Clear Sessions & Retry"
3. Haz clic en el botón
4. Los logs deben mostrar "Clearing all sessions"
5. El formulario debe limpiarse

### Test 4: Acceso Sin Sesión

1. Asegúrate de no estar logueado
2. Intenta ir directamente a `/admin`
3. Debes ser redirigido a `/admin-login`
4. Los logs deben mostrar el redirect

### Test 5: Logout

1. Inicia sesión exitosamente
2. Ve al dashboard
3. Haz logout (implementa el botón si no existe)
4. Debes ser redirigido al login
5. Los logs deben mostrar "Sign out completed"

## Próximos Pasos Si Aún Hay Problemas

Si después de revisar los logs aún tienes problemas:

1. **Copia todos los logs de la consola** y compártelos
2. **Verifica la configuración de Supabase:**
   - Ve a tu proyecto en Supabase
   - Settings → API
   - Copia la URL y la anon key
   - Actualiza tu `.env`

3. **Verifica RLS (Row Level Security):**
   - Ve a Supabase → Table Editor → users
   - Verifica que las políticas RLS permitan lectura autenticada

4. **Verifica el usuario en Auth:**
   - Ve a Supabase → Authentication → Users
   - Confirma que tu usuario existe
   - Verifica el email

## Estructura de Logs por Componente

### Logger Format

```
[Timestamp] [Component] [Level] Message { data }
```

### Niveles de Log

- **DEBUG** - Información detallada de desarrollo
- **INFO** - Información general de flujo
- **WARN** - Advertencias que no detienen el flujo
- **ERROR** - Errores que previenen la operación

## Comparación: Sistema Anterior vs Nuevo

### Sistema Anterior (Problemático)

- ❌ Dependencias circulares entre servicios
- ❌ Manejo de errores inconsistente
- ❌ Sin logs detallados
- ❌ Lógica compleja con muchos efectos secundarios
- ❌ Difícil de debuguear

### Sistema Nuevo (Simple y Robusto)

- ✅ Servicios independientes y claros
- ✅ Manejo de errores en cada paso
- ✅ Logs detallados en tiempo real
- ✅ Lógica lineal y fácil de seguir
- ✅ Fácil de debuguear y mantener

## Principios SOLID Aplicados

1. **Single Responsibility** - Cada servicio hace una cosa
2. **Open/Closed** - Fácil de extender sin modificar
3. **Dependency Inversion** - Depende de abstracciones (interfaces)

---

**Importante:** Siempre revisa la consola del navegador primero. Los logs te dirán exactamente dónde está el problema.

**Recuerda:** Si la pantalla se congela, el último log en la consola te dirá en qué paso se detuvo el proceso.
