import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStorage } from "./utils/initSupabaseStorage";

console.log('🚀 Initializing Supabase Storage buckets...');
initializeStorage().then((success) => {
  if (success) {
    console.log('✅ Supabase Storage initialized successfully');
  } else {
    console.error('❌ Failed to initialize Supabase Storage');
  }
});

createRoot(document.getElementById("root")!).render(<App />);
