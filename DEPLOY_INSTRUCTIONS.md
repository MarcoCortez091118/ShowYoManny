# 🚀 Deployment Instructions - ShowYo App

**Session ID:** ODBxZz666G5PaT7K:58362183:3202205

---

## 🔴 PROBLEMA IDENTIFICADO Y RESUELTO

### ❌ Problema Original
**Firebase Hosting no estaba configurado en `firebase.json`**

La configuración solo incluía:
- ✅ Functions
- ✅ Firestore
- ✅ Storage
- ❌ **Hosting** (FALTABA)

### ✅ Solución Aplicada
Se agregó la configuración de hosting a `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## 📋 Pasos para Desplegar

### 1️⃣ Pre-requisitos

```bash
# Verificar que Firebase CLI esté instalado
firebase --version

# Si no está instalado:
npm install -g firebase-tools

# Login a Firebase
firebase login
```

### 2️⃣ Verificar Configuración

```bash
# Ver proyecto actual
firebase projects:list

# Debería mostrar: showyo-20c51
```

### 3️⃣ Hacer Build

```bash
# Build para producción
npm run build

# Verificar que se generó la carpeta dist/
ls -la dist/

# Deberías ver:
# - index.html
# - assets/
#   - index-*.css
#   - index-*.js
#   - imágenes
```

### 4️⃣ Desplegar

```bash
# Desplegar todo (hosting + functions + firestore + storage)
firebase deploy

# O solo hosting (más rápido)
firebase deploy --only hosting

# Ver progreso
# ✓ Deploy complete!
# Hosting URL: https://showyo-20c51.web.app
```

### 5️⃣ Verificar Despliegue

```bash
# Abrir en navegador
firebase open hosting:site

# O manualmente:
# https://showyo-20c51.web.app
# https://showyo-20c51.firebaseapp.com
```

---

## 🔧 Configuración Aplicada

### `firebase.json` - Antes
```json
{
  "functions": [...],
  "firestore": {...},
  "storage": {...}
}
```

### `firebase.json` - Después ✅
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "functions": [...],
  "firestore": {...},
  "storage": {...}
}
```

### Explicación de la Configuración

```json
{
  "hosting": {
    "public": "dist",              // ← Carpeta con archivos compilados

    "rewrites": [{
      "source": "**",               // ← Todas las rutas
      "destination": "/index.html"  // ← SPA: redirige a index.html
    }],

    "headers": [{
      "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
      "headers": [{
        "key": "Cache-Control",
        "value": "max-age=31536000"  // ← Cache de 1 año para assets
      }]
    }]
  }
}
```

---

## 🌐 URLs de la Aplicación

Después del despliegue, la app estará disponible en:

### URLs Principales
```
🔗 Production: https://showyo-20c51.web.app
🔗 Alternate:  https://showyo-20c51.firebaseapp.com
```

### Rutas de la App
```
📍 Homepage:        https://showyo-20c51.web.app/
📍 Admin Login:     https://showyo-20c51.web.app/admin-login
📍 Admin Dashboard: https://showyo-20c51.web.app/admin
📍 Queue Manager:   https://showyo-20c51.web.app/admin/queue
📍 Content History: https://showyo-20c51.web.app/admin/history
📍 Upload Page:     https://showyo-20c51.web.app/upload
📍 Kiosk Display:   https://showyo-20c51.web.app/kiosk
```

---

## ✅ Checklist Post-Despliegue

### Verificación Básica
```bash
- [ ] Homepage carga correctamente
- [ ] Estilos se aplican (CSS cargado)
- [ ] JavaScript funciona (React renderiza)
- [ ] Imágenes cargan
- [ ] Console sin errores críticos
```

### Verificación de Funcionalidad
```bash
- [ ] Login funciona (/admin-login)
- [ ] Dashboard carga (/admin)
- [ ] Queue manager muestra simulador (/admin/queue)
- [ ] Content history carga (/admin/history)
- [ ] Upload form funciona (/upload)
- [ ] Kiosk display muestra contenido (/kiosk)
```

### Verificación de Database
```bash
- [ ] Supabase conecta correctamente
- [ ] Auth funciona (login/logout)
- [ ] Queue items cargan
- [ ] Content history carga
- [ ] Upload a storage funciona
```

---

## 🐛 Troubleshooting

### Error 1: "Page not found" al acceder a rutas
**Causa:** Rewrite no configurado
**Solución:** Ya aplicado en firebase.json ✅

### Error 2: Assets no cargan (404)
**Causa:** Ruta incorrecta en vite.config.ts
**Verificar:**
```bash
# Abrir DevTools > Network
# Ver si las rutas son:
✅ /assets/index-*.js  (correcto)
❌ /dist/assets/       (incorrecto)
```

**Solución:** Ya configurado correctamente ✅

### Error 3: "Build folder not found"
```bash
# Re-hacer build
npm run build

# Verificar carpeta dist
ls -la dist/
```

### Error 4: Environment variables no disponibles
**Síntoma:** App carga pero no conecta a Supabase

**Verificar en browser console:**
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// Debería imprimir: https://ijekgmegdixbxzgwsenc.supabase.co
```

**Solución:** Variables en .env están correctas ✅

### Error 5: Firebase deploy falla
```bash
# Ver logs detallados
firebase deploy --debug

# Verificar autenticación
firebase login --reauth

# Verificar proyecto
firebase use showyo-20c51
```

---

## 🔄 Re-Despliegue (Updates)

Para actualizaciones futuras:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (si hay cambios)
npm install

# 3. Build
npm run build

# 4. Deploy
firebase deploy --only hosting

# 5. Verificar
# Abrir URL y hacer hard refresh (Ctrl+Shift+R)
```

---

## 📊 Monitoreo Post-Despliegue

### Firebase Console
```
🔗 https://console.firebase.google.com/project/showyo-20c51

Revisar:
- Hosting: Estado del deploy
- Functions: Logs de ejecución
- Firestore: Datos en tiempo real
- Storage: Archivos subidos
- Authentication: Usuarios registrados
```

### Supabase Dashboard
```
🔗 https://supabase.com/dashboard/project/ijekgmegdixbxzgwsenc

Revisar:
- Table Editor: Datos en tablas
- SQL Editor: Ejecutar queries
- Storage: Archivos en buckets
- Logs: Errores de API
```

### Browser DevTools
```
F12 > Console
- Buscar errores rojos
- Verificar warnings
- Revisar failed requests

F12 > Network
- Ver requests a Supabase
- Verificar status codes
- Revisar tiempos de carga

F12 > Application > Local Storage
- Verificar supabase.auth.token
- Verificar session data
```

---

## 🎯 Próximos Pasos

### Inmediato
1. ✅ Configuración de hosting agregada
2. ⏳ Ejecutar `firebase deploy`
3. ⏳ Verificar URLs funcionan
4. ⏳ Test completo de funcionalidades

### Optimización (Opcional)
1. ⏳ Implementar code splitting (bundle size)
2. ⏳ Agregar service worker (PWA)
3. ⏳ Configurar CDN (Cloudflare)
4. ⏳ Habilitar compresión gzip/brotli

### Seguridad
1. ⏳ Configurar Firebase Security Rules
2. ⏳ Revisar RLS policies en Supabase
3. ⏳ Habilitar rate limiting
4. ⏳ Configurar CORS headers

---

## 📞 Comandos de Ayuda

```bash
# Ver hosting actual
firebase hosting:channel:list

# Ver logs en tiempo real
firebase functions:log

# Deshacer deploy (rollback)
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live

# Eliminar versión vieja
firebase hosting:releases:list

# Ver uso y cuotas
firebase projects:list
```

---

## ✅ Resumen

### Problema Identificado
❌ `firebase.json` no tenía configuración de hosting

### Solución Aplicada
✅ Se agregó sección `"hosting"` con:
- Carpeta pública: `dist`
- Rewrites para SPA
- Headers de cache para assets

### Estado Actual
✅ Build compilado exitosamente
✅ Configuración de hosting lista
✅ Variables de entorno configuradas
✅ Database con todas las tablas

### Acción Requerida
```bash
firebase deploy --only hosting
```

### Tiempo Estimado
⏱️ 2-5 minutos para deploy
⏱️ 1-2 minutos para propagación DNS

### Resultado Esperado
🎉 App disponible en:
- https://showyo-20c51.web.app
- https://showyo-20c51.firebaseapp.com

---

**¿Necesitas más ayuda?**
- Firebase Support: https://firebase.google.com/support
- Supabase Support: https://supabase.com/docs/guides/getting-started
