# 🚀 ShowYo App - Despliegue Correcto

**Session:** ODBxZz666G5PaT7K:58362183:3202205
**Backend:** 100% Supabase (NO Firebase)

---

## ✅ ACLARACIÓN IMPORTANTE

Esta aplicación usa **SOLO SUPABASE** para todo el backend.

**NO uses Firebase Hosting ni Firebase Functions.**

---

## 🎯 OPCIÓN RECOMENDADA: Netlify

### Pasos Rápidos:

1. **Ir a Netlify**
   ```
   https://app.netlify.com/signup
   ```

2. **Import from Git**
   - Conectar tu repositorio
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Variables de entorno**
   ```
   VITE_SUPABASE_URL=https://ijekgmegdixbxzgwsenc.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. **Deploy!**

---

## 📝 Archivos Configurados

✅ `netlify.toml` - Listo para deploy
✅ `vercel.json` - Alternativa
❌ `firebase.json` - IGNORAR (no se usa)

---

## 🌐 Arquitectura

```
Frontend (Netlify/Vercel)
    ↓
Supabase Backend
    ↓
PostgreSQL + Storage + Auth
```

**Todo el backend está en Supabase.**
**No hay Firebase.**

---

## 🚀 Deploy en 2 Minutos

```bash
# 1. Push a Git
git push origin main

# 2. En Netlify: Import from Git
# 3. Deploy!
```

URL: `https://tu-app.netlify.app`

---

**¡Listo! 🎉**
