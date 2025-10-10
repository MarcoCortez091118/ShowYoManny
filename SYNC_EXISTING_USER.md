# Sincronizar Usuario Existente de Firebase

Ya tienes un usuario creado en Firebase Authentication (`marco@showyo.app` con UID: `sswn8TDUOLRfyaCSCGwTpFk...`).

Ahora necesitas sincronizar este usuario con Firestore y darle permisos de administrador.

## Opción 1: Usar el endpoint de sincronización (Recomendado)

Después de desplegar las Cloud Functions, ejecuta:

```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/sync-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@showyo.app",
    "password": "TuPasswordActual",
    "makeAdmin": true
  }'
```

O si conoces el UID completo:

```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/sync-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@showyo.app",
    "uid": "sswn8TDUOLRfyaCSCGwTpFk...",
    "password": "TuPasswordActual",
    "makeAdmin": true
  }'
```

## Opción 2: Manual desde Firebase Console

### Paso 1: Crear documento en Firestore

1. Ve a Firebase Console > Firestore Database
2. Crea una colección llamada `users`
3. Crea un documento con ID: `sswn8TDUOLRfyaCSCGwTpFk...` (el UID del usuario)
4. Añade los siguientes campos:

```javascript
{
  email: "marco@showyo.app",
  displayName: "Marco Admin",
  roles: ["admin", "user"],
  firebaseUid: "sswn8TDUOLRfyaCSCGwTpFk...",
  passwordHash: "hash-generado-con-bcrypt",
  createdAt: Timestamp (fecha actual),
  updatedAt: Timestamp (fecha actual)
}
```

### Paso 2: Establecer Custom Claims

Desde Firebase Console, no se pueden establecer Custom Claims directamente. Necesitas usar la Cloud Function o hacerlo manualmente con Node.js:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

admin.auth().setCustomUserClaims('sswn8TDUOLRfyaCSCGwTpFk...', {
  admin: true,
  roles: ['admin', 'user']
}).then(() => {
  console.log('Custom claims set successfully');
});
```

## Opción 3: Script Node.js Local

Crea un archivo `sync-user.js`:

```javascript
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function syncUser() {
  const uid = 'sswn8TDUOLRfyaCSCGwTpFk...'; // UID completo
  const email = 'marco@showyo.app';
  const password = 'TuPasswordActual';

  const passwordHash = await bcrypt.hash(password, 10);

  await admin.firestore().collection('users').doc(uid).set({
    email,
    displayName: 'Marco Admin',
    roles: ['admin', 'user'],
    firebaseUid: uid,
    passwordHash,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await admin.auth().setCustomUserClaims(uid, {
    admin: true,
    roles: ['admin', 'user']
  });

  console.log('User synced successfully!');
  process.exit(0);
}

syncUser().catch(console.error);
```

Ejecuta:
```bash
node sync-user.js
```

## Verificar la Sincronización

Una vez sincronizado, verifica:

1. **En Firestore**: Debe existir el documento en `users/{uid}`
2. **Custom Claims**: Puedes verificar con:
   ```javascript
   admin.auth().getUser(uid).then(user => {
     console.log(user.customClaims);
   });
   ```

## Probar el Login

Después de sincronizar, prueba el login:

```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "marco@showyo.app",
    "password": "TuPasswordActual"
  }'
```

Deberías recibir un token JWT y los datos del usuario con rol de admin.

## Acceder al Dashboard

1. Ve a la aplicación: `https://tu-dominio.com/admin/login`
2. Ingresa:
   - Email: `marco@showyo.app`
   - Password: Tu password actual
3. Deberías ser redirigido al dashboard de administrador

## Troubleshooting

### Error: "Invalid email or password"
- Verifica que el documento en Firestore tenga el `passwordHash` correcto
- Asegúrate de que el password usado en la sincronización coincida con el que intentas usar

### Error: "User not found"
- Verifica que el documento en Firestore use el UID correcto como ID
- Confirma que el email en Firestore coincida con el de Firebase Auth

### Error: "Admin access required"
- Verifica que los Custom Claims estén establecidos correctamente
- Revisa que el campo `roles` en Firestore contenga `['admin', 'user']`

### Usuario no puede acceder a funciones de admin
- Puede ser necesario que el usuario cierre sesión y vuelva a iniciar sesión después de establecer los Custom Claims
- Los Custom Claims se actualizan en el token JWT, que se genera en cada login

## Credenciales Actuales

- **Email**: `marco@showyo.app`
- **UID**: `sswn8TDUOLRfyaCSCGwTpFk...` (truncado)
- **Creado**: 9 oct 2025

Una vez sincronizado, este usuario tendrá acceso completo al dashboard de administración.
