import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const exercises = [
  { name: "Press de banca", muscle_group: "Pecho", equipment: "Barra" },
  { name: "Press inclinado", muscle_group: "Pecho", equipment: "Barra" },
  { name: "Press declinado", muscle_group: "Pecho", equipment: "Barra" },
  { name: "Aperturas con mancuernas", muscle_group: "Pecho", equipment: "Mancuernas" },
  { name: "Fondos en paralelas", muscle_group: "Pecho", equipment: "Peso corporal" },
  { name: "Press de pecho en máquina", muscle_group: "Pecho", equipment: "Máquina" },
  { name: "Cruce de poleas", muscle_group: "Pecho", equipment: "Polea" },

  { name: "Dominadas", muscle_group: "Espalda", equipment: "Peso corporal" },
  { name: "Remo con barra", muscle_group: "Espalda", equipment: "Barra" },
  { name: "Remo con mancuerna", muscle_group: "Espalda", equipment: "Mancuernas" },
  { name: "Jalón al pecho", muscle_group: "Espalda", equipment: "Polea" },
  { name: "Remo en máquina", muscle_group: "Espalda", equipment: "Máquina" },
  { name: "Peso muerto", muscle_group: "Espalda", equipment: "Barra" },
  { name: "Face pull", muscle_group: "Espalda", equipment: "Polea" },

  { name: "Press militar", muscle_group: "Hombros", equipment: "Barra" },
  { name: "Press de hombros con mancuernas", muscle_group: "Hombros", equipment: "Mancuernas" },
  { name: "Elevaciones laterales", muscle_group: "Hombros", equipment: "Mancuernas" },
  { name: "Elevaciones frontales", muscle_group: "Hombros", equipment: "Mancuernas" },
  { name: "Pájaros (elevación posterior)", muscle_group: "Hombros", equipment: "Mancuernas" },
  { name: "Press Arnold", muscle_group: "Hombros", equipment: "Mancuernas" },

  { name: "Sentadilla", muscle_group: "Piernas", equipment: "Barra" },
  { name: "Prensa de piernas", muscle_group: "Piernas", equipment: "Máquina" },
  { name: "Zancadas", muscle_group: "Piernas", equipment: "Mancuernas" },
  { name: "Peso muerto rumano", muscle_group: "Piernas", equipment: "Barra" },
  { name: "Extensión de cuádriceps", muscle_group: "Piernas", equipment: "Máquina" },
  { name: "Curl femoral", muscle_group: "Piernas", equipment: "Máquina" },
  { name: "Elevación de talones", muscle_group: "Piernas", equipment: "Máquina" },
  { name: "Hip thrust", muscle_group: "Piernas", equipment: "Barra" },

  { name: "Curl de bíceps con barra", muscle_group: "Bíceps", equipment: "Barra" },
  { name: "Curl de bíceps con mancuernas", muscle_group: "Bíceps", equipment: "Mancuernas" },
  { name: "Curl martillo", muscle_group: "Bíceps", equipment: "Mancuernas" },
  { name: "Press francés", muscle_group: "Tríceps", equipment: "Barra" },
  { name: "Extensión de tríceps en polea", muscle_group: "Tríceps", equipment: "Polea" },
  { name: "Fondos de tríceps en banco", muscle_group: "Tríceps", equipment: "Peso corporal" },

  { name: "Plancha", muscle_group: "Core", equipment: "Peso corporal" },
  { name: "Crunch abdominal", muscle_group: "Core", equipment: "Peso corporal" },
  { name: "Elevación de piernas colgado", muscle_group: "Core", equipment: "Peso corporal" },
  { name: "Russian twist", muscle_group: "Core", equipment: "Peso corporal" },
];

async function seed() {
  const batch = db.batch();
  exercises.forEach((ex) => {
    const ref = db.collection("exercises").doc();
    batch.set(ref, { ...ex, owner_id: null, is_global: true });
  });
  await batch.commit();
  console.log(`Listo: ${exercises.length} ejercicios cargados.`);
}

seed();
