import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Lee las credenciales de servicio (Asegúrate de haber descargado serviceAccountKey.json)
// NO LO SUBAS AL REPOSITORIO
try {
  const serviceAccount = JSON.parse(readFileSync('./scripts/serviceAccountKey.json', 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (error) {
  console.error('❌ Error: No se pudo leer ./scripts/serviceAccountKey.json');
  console.error('Debes descargarlo desde Configuración del Proyecto > Cuentas de Servicio en Firebase y colocarlo en la raíz del proyecto.');
  process.exit(1);
}

const db = getFirestore();

const CARDIO_EXERCISES = [
  { name: 'Cinta de Correr', equipment: 'Cinta', type: 'cardio' },
  { name: 'Bicicleta Estática', equipment: 'Bicicleta', type: 'cardio' },
  { name: 'Caminata', equipment: 'Ninguno', type: 'cardio' },
  { name: 'Escaladora', equipment: 'Escaladora', type: 'cardio' },
  { name: 'Elíptica', equipment: 'Elíptica', type: 'cardio' },
  { name: 'Remo', equipment: 'Remo', type: 'cardio' },
  { name: 'Salto de Cuerda', equipment: 'Cuerda', type: 'cardio' }
];

async function seed() {
  console.log('Iniciando seed de ejercicios de Cardio con Firebase Admin...');
  const exercisesCol = db.collection('exercises');

  for (const ex of CARDIO_EXERCISES) {
    const data = {
      name: ex.name,
      muscle_group: 'Cardiovascular',
      equipment: ex.equipment,
      type: ex.type,
      owner_id: null, // Global
      is_global: true
    };
    
    try {
      const docRef = await exercisesCol.add(data);
      console.log(`✅ Creado: ${ex.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`❌ Error creando ${ex.name}:`, error);
    }
  }
  
  console.log('Seed completado.');
  process.exit(0);
}

seed();
