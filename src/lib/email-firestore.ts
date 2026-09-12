import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { isValidEmail, normalizeEmail } from "./email-utils";

export type EmailTestRecipient = {
  id: string;
  nome: string;
  email: string;
  created_at: string;
};

/**
 * Real-time listener for the e-mail test recipients of an event.
 */
export function subscribeToEmailTestRecipients(
  eventSlug: string = "inauguracao",
  onUpdate: (recipients: EmailTestRecipient[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const col = collection(db, "events", eventSlug, "emailTestRecipients");
  const q = query(col, orderBy("created_at", "asc"));

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
          email: data.email || "",
          created_at: created_at_str,
        };
      });
      onUpdate(list);
    },
    (err) => {
      console.error("Firestore email test recipients subscription error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Adds a test recipient. The document id is the normalized e-mail (deduplicates).
 */
export async function addEmailTestRecipient(
  eventSlug: string = "inauguracao",
  { nome, email }: { nome: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  const trimmedName = nome.trim();
  const normalizedEmail = normalizeEmail(email);

  if (!trimmedName) {
    return { success: false, error: "Informe o nome do destinatário." };
  }
  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: "Informe um e-mail válido." };
  }

  try {
    const docId = normalizedEmail.replace(/[^a-z0-9@._-]/g, "_");
    const docRef = doc(db, "events", eventSlug, "emailTestRecipients", docId);
    await setDoc(docRef, {
      nome: trimmedName,
      email: normalizedEmail,
      created_at: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding email test recipient:", error);
    return {
      success: false,
      error: "Não foi possível salvar o destinatário de teste.",
    };
  }
}

/**
 * Removes a test recipient.
 */
export async function deleteEmailTestRecipient(
  eventSlug: string = "inauguracao",
  recipientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, "events", eventSlug, "emailTestRecipients", recipientId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting email test recipient:", error);
    return {
      success: false,
      error: "Não foi possível remover o destinatário de teste.",
    };
  }
}
