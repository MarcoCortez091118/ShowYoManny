# Deploy con Modo Test - Guía Rápida

## 🚨 Error Actual

```
No such price: 'price_1S8tpmF6Bz1PoBh5FA5LLqTK';
a similar object exists in live mode, but a test mode key was used to make this request.
```

**Causa:** El deploy en Netlify está usando código viejo que no tiene `VITE_STRIPE_MODE`. Está enviando Price IDs de live con clave de test.

**Solución:** Hacer deploy con los nuevos cambios y configurar la variable de entorno.

---

## ✅ Pasos para Resolver

### **Paso 1: Verificar Configuración Local**

```bash
# Verificar que .env tiene la variable
cat .env | grep VITE_STRIPE_MODE

# Debe mostrar:
# VITE_STRIPE_MODE=test
```

✅ Ya configurado

### **Paso 2: Configurar Variable en Netlify**

#### **Opción A: Via Netlify Dashboard (Recomendado)**

1. Ve a: https://app.netlify.com
2. Selecciona tu sitio: **showyotest**
3. Ve a: **Site configuration** → **Environment variables**
4. Click **Add a variable**
5. Agrega:
   ```
   Key: VITE_STRIPE_MODE
   Value: test
   ```
6. Click **Save**

#### **Opción B: Via Netlify CLI**

```bash
# Si tienes Netlify CLI instalado
netlify env:set VITE_STRIPE_MODE test
```

### **Paso 3: Hacer Deploy**

#### **Opción A: Git Push (Automático)**

```bash
# Commit los cambios
git add .
git commit -m "Add test/live mode configuration for Stripe"
git push origin main

# Netlify detectará el push y hará deploy automático
```

#### **Opción B: Deploy Manual desde CLI**

```bash
# Build local
npm run build

# Deploy a Netlify
netlify deploy --prod

# O si prefieres preview primero:
netlify deploy
# Luego si funciona:
netlify deploy --prod
```

#### **Opción C: Trigger Manual en Netlify**

1. Ve a: Netlify Dashboard → Tu sitio
2. Click **Deploys**
3. Click **Trigger deploy** → **Clear cache and deploy site**

### **Paso 4: Verificar Supabase Edge Functions**

Asegúrate que las secrets estén en test mode:

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **Edge Functions** → **Secrets**
4. Verifica:

```bash
✅ STRIPE_SECRET_KEY = sk_test_51S0YRBF6Bz1PoBh5...
✅ STRIPE_WEBHOOK_SECRET = whsec_[tu-webhook-secret-test]
```

**Si tiene `sk_live_...` ⚠️ Cámbialo a `sk_test_...`**

---

## 🧪 Verificación Post-Deploy

### **1. Verificar Variable de Entorno**

Una vez que el deploy termine, verifica que la variable está activa:

```bash
# En tu navegador, abre la consola en:
https://showyotest.netlify.app/upload

# En la consola ejecuta:
console.log('Stripe Mode:', import.meta.env.VITE_STRIPE_MODE);

# Debe mostrar: "test"
```

### **2. Test Completo del Flujo**

```
1. Ve a: https://showyotest.netlify.app/upload
2. Sube una foto o video
3. Selecciona plan "Clean Photo" ($15)
4. Click "Pay & Upload Content"

Resultado Esperado:
✅ Stripe Checkout abre
✅ Muestra "Test mode" en la UI de Stripe
✅ Price ID usado: price_1ST554F6Bz1PoBh56glS9TuX (test)
✅ No da error de "live mode"
```

### **3. Usar Tarjeta de Prueba**

```
Número: 4242 4242 4242 4242
Expiración: 12/25
CVC: 123
ZIP: 12345
```

### **4. Verificar en Logs de Supabase**

1. Ve a Supabase Dashboard
2. **Edge Functions** → **stripe-checkout** → **Logs**
3. Busca el último request
4. Debe mostrar:
   ```
   Creating Stripe session with price: price_1ST554F6Bz1PoBh56glS9TuX
   ```

---

## 🔍 Troubleshooting

### **Error: Variable no definida después del deploy**

**Síntoma:**
```javascript
console.log(import.meta.env.VITE_STRIPE_MODE); // undefined
```

**Causa:** Netlify no tiene la variable configurada o no se rebuildeó

**Solución:**
1. Verifica en Netlify Dashboard → Environment variables
2. Si existe, trigger nuevo deploy:
   ```bash
   # Clear cache and rebuild
   netlify deploy --prod --clear-cache
   ```

### **Error: Sigue usando Price IDs de live**

**Síntoma:**
```
Error: No such price: 'price_1S8tpmF6Bz1PoBh5FA5LLqTK'
```

**Causa:** El código deplorado es viejo

**Solución:**
```bash
# Force rebuild con los nuevos archivos
git add shared/plans.ts src/domain/services/planService.ts
git commit -m "Force update test/live mode"
git push origin main
```

### **Error: Webhook signature verification failed**

**Síntoma:**
```
Error: No signatures found matching the expected signature for payload
```

**Causa:** Webhook secret en Supabase no coincide con Stripe

**Solución:**

1. Ve a Stripe Dashboard (modo test)
2. **Developers** → **Webhooks**
3. Selecciona tu webhook endpoint
4. Click **Reveal** en "Signing secret"
5. Copia el valor `whsec_...`
6. Ve a Supabase → Edge Functions → Secrets
7. Actualiza `STRIPE_WEBHOOK_SECRET` con el nuevo valor

### **Error: Build exitoso pero cambios no se reflejan**

**Causa:** Cache de Netlify

**Solución:**
```bash
# En Netlify Dashboard:
Deploys → Trigger deploy → Clear cache and deploy site
```

---

## 📋 Checklist de Deploy

Antes de hacer deploy, verifica:

### **Configuración Local**
- [ ] `.env` tiene `VITE_STRIPE_MODE=test`
- [ ] `shared/plans.ts` tiene todos los test Price IDs
- [ ] `npm run build` funciona sin errores
- [ ] Cambios están commiteados a git

### **Configuración Netlify**
- [ ] Variable `VITE_STRIPE_MODE=test` configurada
- [ ] Trigger deploy o push a git
- [ ] Deploy completa exitosamente
- [ ] Sitio accesible

### **Configuración Supabase**
- [ ] `STRIPE_SECRET_KEY` es de test (`sk_test_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` es de test mode
- [ ] Edge functions deployados y funcionando

### **Verificación Post-Deploy**
- [ ] Variable `VITE_STRIPE_MODE` accesible en navegador
- [ ] Upload page carga correctamente
- [ ] Stripe Checkout abre en test mode
- [ ] Tarjeta de prueba funciona
- [ ] Payment success y contenido aparece en queue

---

## 🚀 Comandos Rápidos

### **Deploy Completo**

```bash
# 1. Build local
npm run build

# 2. Verificar que funciona
npm run preview

# 3. Commit cambios
git add .
git commit -m "Configure test/live Stripe mode"
git push origin main

# Netlify hará deploy automático
```

### **Deploy Manual (si tienes Netlify CLI)**

```bash
# Install Netlify CLI si no lo tienes
npm install -g netlify-cli

# Login
netlify login

# Link tu proyecto
netlify link

# Configurar variable
netlify env:set VITE_STRIPE_MODE test

# Deploy
netlify deploy --prod
```

### **Verificación Rápida**

```bash
# Después del deploy, ejecuta en tu navegador:
fetch('https://showyotest.netlify.app/').then(() =>
  console.log('VITE_STRIPE_MODE:', import.meta.env.VITE_STRIPE_MODE)
)
```

---

## 📊 Estado Actual vs Esperado

### **Antes (Estado Actual en Netlify)**

```typescript
// ❌ No tiene VITE_STRIPE_MODE
const priceId = PLAN_PRICE_ID_LOOKUP[planId];
// Resultado: price_1S8tpmF6Bz1PoBh5FA5LLqTK (live)

// ❌ Con sk_test_... en Supabase
// Error: live price con test key
```

### **Después (Estado Esperado)**

```typescript
// ✅ Tiene VITE_STRIPE_MODE=test
const mode = getStripeMode(); // "test"
const priceId = getStripePriceId(planId, mode);
// Resultado: price_1ST554F6Bz1PoBh56glS9TuX (test)

// ✅ Con sk_test_... en Supabase
// Success: test price con test key
```

---

## 🎯 Resumen

**Problema:** Deploy antiguo sin `VITE_STRIPE_MODE`

**Solución:**
1. Configurar variable en Netlify
2. Deploy nuevo código
3. Verificar funcionamiento

**Tiempo estimado:** 5-10 minutos

**Una vez resuelto:**
- ✅ Test mode funcionará correctamente
- ✅ Podrás usar tarjetas de prueba
- ✅ Sin errores de "live mode"
- ✅ Sistema listo para testing completo

---

## 📞 Si Necesitas Ayuda

**Error persiste después de deploy?**

1. Verifica logs de Netlify:
   ```
   Netlify Dashboard → Deploys → [último deploy] → Deploy log
   ```

2. Verifica logs de Supabase:
   ```
   Supabase Dashboard → Edge Functions → Logs
   ```

3. Verifica en navegador:
   ```javascript
   // En consola del navegador
   console.log('All env vars:', import.meta.env);
   ```

4. Comparte los logs para debug adicional

---

**Status:** 🚧 Pendiente de Deploy
**Próximo Paso:** Configurar `VITE_STRIPE_MODE` en Netlify y hacer deploy
