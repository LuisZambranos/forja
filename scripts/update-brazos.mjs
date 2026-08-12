import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function update() {
  const snapshot = await db.collection("exercises").where("muscle_group", "==", "Brazos").get();
  
  if (snapshot.empty) {
    console.log("No se encontraron ejercicios con la categoría Brazos.");
    return;
  }

  const batch = db.batch();
  
  snapshot.forEach(doc => {
    const data = doc.data();
    let newGroup = "Brazos";
    if (data.name.toLowerCase().includes("bíceps") || data.name.toLowerCase().includes("martillo")) {
      newGroup = "Bíceps";
    } else if (data.name.toLowerCase().includes("tríceps") || data.name.toLowerCase().includes("francés")) {
      newGroup = "Tríceps";
    }
    
    batch.update(doc.ref, { muscle_group: newGroup });
    console.log(`Actualizando ${data.name} a ${newGroup}`);
  });

  await batch.commit();
  console.log("Actualización completa.");
}

update();
