import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

export type Slot = {
  id?: string;
  horario: string;
  capacity: number;
  taken: number;
  ordem: number;
};

export type Rsvp = {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  data_nascimento?: string;
  horario: string;
  created_at: string;
};

const DEFAULT_SLOTS: Omit<Slot, "id">[] = [
  { horario: "15h30", capacity: 20, taken: 0, ordem: 1 },
  { horario: "16h30", capacity: 20, taken: 0, ordem: 2 },
  { horario: "17h30", capacity: 20, taken: 0, ordem: 3 },
];

/**
 * Normalizes phone numbers to digits only
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Initializes default slots in Firestore if they don't exist yet
 */
export async function ensureDefaultSlots(eventSlug: string = "inauguracao"): Promise<Slot[]> {
  try {
    const slotsCol = collection(db, "events", eventSlug, "slots");
    const snapshot = await getDocs(query(slotsCol, orderBy("ordem", "asc")));

    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Slot, "id">),
      }));
    }

    // Initialize default slots in firestore
    const createdSlots: Slot[] = [];
    for (const slot of DEFAULT_SLOTS) {
      const slotDocId = slot.horario.replace(":", "-");
      const slotRef = doc(db, "events", eventSlug, "slots", slotDocId);
      await setDoc(slotRef, slot);
      createdSlots.push({ id: slotDocId, ...slot });
    }
    return createdSlots;
  } catch (error) {
    console.warn("Could not connect or populate Firestore slots, using memory defaults:", error);
    return DEFAULT_SLOTS.map((s, i) => ({ id: `slot-${i}`, ...s }));
  }
}

/**
 * Fetches current slots and capacity availability
 */
export async function getEventSlots(eventSlug: string = "inauguracao"): Promise<Slot[]> {
  try {
    const slotsCol = collection(db, "events", eventSlug, "slots");
    const q = query(slotsCol, orderBy("ordem", "asc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return await ensureDefaultSlots(eventSlug);
    }

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Slot, "id">),
    }));
  } catch (err) {
    console.error("Error fetching slots from Firestore:", err);
    return DEFAULT_SLOTS.map((s, i) => ({ id: `slot-${i}`, ...s }));
  }
}

/**
 * Real-time listener for slots and capacities
 */
export function subscribeToEventSlots(
  eventSlug: string = "inauguracao",
  onUpdate: (slots: Slot[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const slotsCol = collection(db, "events", eventSlug, "slots");
  const q = query(slotsCol, orderBy("ordem", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        ensureDefaultSlots(eventSlug).then(onUpdate).catch(console.error);
        return;
      }
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Slot, "id">),
      }));
      onUpdate(list);
    },
    (err) => {
      console.error("Firestore slots subscription error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Updates slot capacity in Firestore
 */
export async function updateSlotCapacity(
  eventSlug: string = "inauguracao",
  slotIdOrHorario: string,
  newCapacity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsedCapacity = Number(newCapacity);
    if (isNaN(parsedCapacity) || parsedCapacity < 0) {
      return { success: false, error: "A capacidade deve ser um número maior ou igual a 0." };
    }

    const slotDocId = slotIdOrHorario.includes(":")
      ? slotIdOrHorario.replace(":", "-")
      : slotIdOrHorario;
    const slotRef = doc(db, "events", eventSlug, "slots", slotDocId);

    await setDoc(
      slotRef,
      {
        capacity: parsedCapacity,
      },
      { merge: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error updating slot capacity:", error);
    return {
      success: false,
      error: "Não foi possível atualizar a capacidade.",
    };
  }
}

/**
 * Synchronizes the public availability counter with the confirmed RSVPs.
 */
export async function updateSlotTaken(
  eventSlug: string = "inauguracao",
  slotIdOrHorario: string,
  taken: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsedTaken = Number(taken);
    if (!Number.isInteger(parsedTaken) || parsedTaken < 0) {
      return { success: false, error: "A quantidade de reservas deve ser um número válido." };
    }

    const slotDocId = slotIdOrHorario.includes(":")
      ? slotIdOrHorario.replace(":", "-")
      : slotIdOrHorario;
    const slotRef = doc(db, "events", eventSlug, "slots", slotDocId);

    await setDoc(slotRef, { taken: parsedTaken }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error synchronizing slot availability:", error);
    return {
      success: false,
      error: "Não foi possível sincronizar a disponibilidade.",
    };
  }
}

/**
 * Submits an RSVP using a Firestore transaction to prevent double-booking and duplicate numbers
 */
export async function submitRsvp({
  eventSlug = "inauguracao",
  nome,
  whatsapp,
  email,
  dataNascimento,
  horario,
}: {
  eventSlug?: string;
  nome: string;
  whatsapp: string;
  email?: string;
  dataNascimento?: string;
  horario: string;
}): Promise<{ success: boolean; error?: string }> {
  const digits = normalizePhone(whatsapp);
  const slotDocId = horario.replace(":", "-");
  const slotRef = doc(db, "events", eventSlug, "slots", slotDocId);
  const rsvpDocRef = doc(db, "events", eventSlug, "rsvps", `${digits}`);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Check if user with this phone already registered
      const existingRsvp = await transaction.get(rsvpDocRef);
      if (existingRsvp.exists()) {
        throw new Error("WHATSAPP_EXISTS");
      }

      // 2. Check slot capacity
      const slotDoc = await transaction.get(slotRef);
      if (!slotDoc.exists()) {
        // If slot doc doesn't exist, create it with capacity 20 and taken 1
        transaction.set(slotRef, {
          horario,
          capacity: 20,
          taken: 1,
          ordem: 1,
        });
      } else {
        const data = slotDoc.data() as Slot;
        const taken = data.taken || 0;
        const capacity = data.capacity || 20;

        if (taken >= capacity) {
          throw new Error("HORARIO_ESGOTADO");
        }

        transaction.update(slotRef, {
          taken: taken + 1,
        });
      }

      // 3. Insert RSVP
      transaction.set(rsvpDocRef, {
        event_slug: eventSlug,
        nome,
        whatsapp,
        digits,
        email: email || "",
        data_nascimento: dataNascimento || "",
        horario,
        created_at: serverTimestamp(),
      });
    });

    return { success: true };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage === "WHATSAPP_EXISTS") {
      return {
        success: false,
        error: "Esse WhatsApp já tem presença confirmada. Fale com a equipe para trocar o horário.",
      };
    }
    if (errMessage === "HORARIO_ESGOTADO") {
      return {
        success: false,
        error: "Esse horário acabou de esgotar. Por favor, escolha outro.",
      };
    }
    console.error("Firestore RSVP error:", error);
    return {
      success: false,
      error: "Não conseguimos enviar agora. Tente de novo em alguns segundos.",
    };
  }
}

/**
 * Fetches all RSVPs for the team panel
 */
export async function getEventRsvps(eventSlug: string = "inauguracao"): Promise<Rsvp[]> {
  try {
    const rsvpsCol = collection(db, "events", eventSlug, "rsvps");
    const q = query(rsvpsCol, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      let created_at_str = new Date().toISOString();
      if (data.created_at instanceof Timestamp) {
        created_at_str = data.created_at.toDate().toLocaleString("pt-BR");
      }
      return {
        id: d.id,
        nome: data.nome,
        whatsapp: data.whatsapp,
        email: data.email || "",
        data_nascimento: data.data_nascimento || "",
        horario: data.horario,
        created_at: created_at_str,
      };
    });
  } catch (err) {
    console.error("Error fetching team RSVPs:", err);
    throw err;
  }
}

/**
 * Real-time listener for RSVPs
 */
export function subscribeToEventRsvps(
  eventSlug: string = "inauguracao",
  onUpdate: (rsvps: Rsvp[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const rsvpsCol = collection(db, "events", eventSlug, "rsvps");
  const q = query(rsvpsCol, orderBy("created_at", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        let created_at_str = "";
        if (data.created_at instanceof Timestamp) {
          created_at_str = data.created_at.toDate().toLocaleString("pt-BR");
        } else if (data.created_at) {
          created_at_str = String(data.created_at);
        }
        return {
          id: d.id,
          nome: data.nome || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          data_nascimento: data.data_nascimento || "",
          horario: data.horario || "",
          created_at: created_at_str,
        };
      });
      onUpdate(list);
    },
    (err) => {
      console.error("Firestore RSVP subscription error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Deletes an RSVP and decrements the slot counter
 */
export async function deleteRsvp(
  eventSlug: string = "inauguracao",
  rsvpId: string,
  horario?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const rsvpDocRef = doc(db, "events", eventSlug, "rsvps", rsvpId);

    await runTransaction(db, async (transaction) => {
      const rsvpDoc = await transaction.get(rsvpDocRef);
      if (!rsvpDoc.exists()) {
        return;
      }
      const data = rsvpDoc.data();
      const targetHorario = horario || data?.horario;

      if (targetHorario) {
        const slotDocId = targetHorario.replace(":", "-");
        const slotRef = doc(db, "events", eventSlug, "slots", slotDocId);
        const slotDoc = await transaction.get(slotRef);
        if (slotDoc.exists()) {
          const slotData = slotDoc.data() as Slot;
          const currentTaken = slotData.taken || 0;
          transaction.update(slotRef, {
            taken: Math.max(0, currentTaken - 1),
          });
        }
      }

      transaction.delete(rsvpDocRef);
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    return {
      success: false,
      error: "Não foi possível excluir a confirmação.",
    };
  }
}
