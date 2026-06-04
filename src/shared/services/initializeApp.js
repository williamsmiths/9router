import { cleanupProviderConnections } from "@/lib/localDb";

export async function initializeApp() {
  try {
    await cleanupProviderConnections();
  } catch (error) {
    console.error("[InitApp] Error:", error);
  }
}

export default initializeApp;
