import { defineConfig } from "vite";
import path from "path";

async function resolveReactPlugin() {
  try {
    const { default: react } = await import("@vitejs/plugin-react-swc");
    return react();
  } catch (error) {
    console.warn(
      "@vitejs/plugin-react-swc failed to load; falling back to a minimal JSX transform.",
      error instanceof Error ? error.message : error,
    );

    return {
      name: "react-jsx-fallback",
      config() {
        return {
          esbuild: {
            jsx: "automatic",
            jsxImportSource: "react",
          },
        };
      },
    };
  }
}

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const reactPlugin = await resolveReactPlugin();

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: reactPlugin ? [reactPlugin] : [],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react",
    },
  };
});
