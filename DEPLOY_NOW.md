# 🚀 Despliegue Inmediato - ShowYo Firebase Functions

## ✅ Estado Actual

Ya he completado estos pasos por ti:
- ✅ Instaladas las dependencias de Firebase Functions
- ✅ Compilado TypeScript a JavaScript (directorio `functions/lib/`)
- ✅ Todas las funciones de autenticación están listas

## 📋 Pasos que DEBES Hacer Manualmente

### Paso 1: Instalar Firebase CLI (Solo una vez)

```bash
npm install -g firebase-tools
```

### Paso 2: Login a Firebase

```bash
firebase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Google.

### Paso 3: Verificar el Proyecto

```bash
cd /tmp/cc-agent/58362183/project
firebase use
```

Deberías ver: `Active Project: showyo-20c51`

Si no está configurado:
```bash
firebase use showyo-20c51
```

### Paso 4: Desplegar Functions

```bash
firebase deploy --only functions
```

**Nota:** Este comando puede tardar 2-5 minutos. Verás un output similar a:

```
✔  functions: Finished running predeploy script.
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (XX.XX KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: updating Node.js 20 function api(us-central1)...
✔  functions[api(us-central1)] Successful update operation.

✔  Deploy complete!
```

### Paso 5: Sincronizar tu Usuario

Una vez desplegadas las functions, ejecuta:

```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/sync-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@showyo.app",
    "password": "TU_PASSWORD_ACTUAL",
    "makeAdmin": true
  }'
```

**IMPORTANTE:** Reemplaza `TU_PASSWORD_ACTUAL` con tu password real.

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "User synced successfully",
  "user": {
    "id": "sswn8TDUOLRfyaCSCGwTpFk...",
    "email": "marco@showyo.app",
    "displayName": "Admin",
    "roles": ["admin", "user"]
  }
}
```

### Paso 6: Probar el Login

```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@showyo.app",
    "password": "TU_PASSWORD_ACTUAL"
  }'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "sswn8TDUOLRfyaCSCGwTpFk...",
    "email": "marco@showyo.app",
    "displayName": "Admin",
    "roles": ["admin", "user"]
  }
}
```

### Paso 7: Acceder a tu Aplicación

1. Abre tu aplicación en el navegador
2. Ve a `/admin/login`
3. Ingresa tus credenciales:
   - Email: `marco@showyo.app`
   - Password: Tu password actual
4. Deberías ser redirigido al dashboard de admin

## 🔧 Comandos Útiles Post-Despliegue

### Ver logs de las funciones
```bash
firebase functions:log
```

### Ver logs en tiempo real
```bash
firebase functions:log --follow
```

### Desplegar solo Firestore rules
```bash
firebase deploy --only firestore
```

### Desplegar solo Storage rules
```bash
firebase deploy --only storage
```

### Desplegar todo
```bash
firebase deploy
```

## ⚠️ Troubleshooting

### Error: "Billing account not configured"
**Solución:** Habilita la facturación en Firebase Console:
1. Ve a https://console.firebase.google.com
2. Selecciona el proyecto "showyo-20c51"
3. Ve a Settings > Usage and billing
4. Configura una cuenta de facturación (plan Blaze)

### Error: "Permission denied"
**Solución:** Verifica que estás autenticado:
```bash
firebase login --reauth
```

### Error: "Project not found"
**Solución:** Asegúrate de estar usando el proyecto correcto:
```bash
firebase use showyo-20c51
```

### Error al sincronizar usuario: "User not found"
**Solución:** Verifica que el email sea exactamente `marco@showyo.app` como aparece en Firebase Auth.

### Error: "Invalid password"
**Solución:** Asegúrate de usar el password correcto de tu cuenta de Firebase Auth.

## 🎯 URLs Importantes

Una vez desplegado:

- **API Base URL:** `https://us-central1-showyo-20c51.cloudfunctions.net/api`
- **Health Check:** `https://us-central1-showyo-20c51.cloudfunctions.net/api/health`
- **Firebase Console:** `https://console.firebase.google.com/project/showyo-20c51`

## 📝 Endpoints Disponibles

```
POST /api/auth/login          - Iniciar sesión
POST /api/auth/logout         - Cerrar sesión (requiere token)
GET  /api/auth/session        - Verificar sesión (requiere token)
POST /api/auth/create-admin   - Crear nuevo admin
POST /api/auth/sync-user      - Sincronizar usuario existente
GET  /api/health              - Health check
```

## 🔒 Seguridad

Después del despliegue inicial, considera:

1. **Cambiar el JWT_SECRET:**
```bash
firebase functions:config:set jwt.secret="$(openssl rand -base64 32)"
firebase deploy --only functions
```

2. **Restringir CORS en producción:**
   - Edita `functions/src/middleware/cors.ts`
   - Cambia `origin: true` por tu dominio específico

3. **Revisar Firestore Rules:**
   - Ve a Firebase Console > Firestore > Rules
   - Verifica que las reglas de seguridad sean apropiadas

## ✅ Checklist de Despliegue

- [ ] Firebase CLI instalado
- [ ] Login a Firebase completado
- [ ] Proyecto verificado (`firebase use`)
- [ ] Functions desplegadas (`firebase deploy --only functions`)
- [ ] Usuario sincronizado (curl a `/auth/sync-user`)
- [ ] Login probado (curl a `/auth/login`)
- [ ] Acceso al dashboard verificado
- [ ] Firestore rules desplegadas
- [ ] Storage rules desplegadas
- [ ] JWT_SECRET cambiado en producción

## 🎉 ¡Listo!

Una vez completados estos pasos, tu sistema ShowYo estará completamente funcional con:
- ✅ Autenticación de usuarios
- ✅ Roles de administrador
- ✅ API REST segura
- ✅ JWT tokens
- ✅ Integración con Firebase Auth y Firestore
