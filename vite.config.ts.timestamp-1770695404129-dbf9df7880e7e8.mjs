// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
async function resolveReactPlugin() {
  try {
    const { default: react } = await import("@vitejs/plugin-react-swc");
    return react();
  } catch (error) {
    console.warn(
      "@vitejs/plugin-react-swc failed to load; falling back to a minimal JSX transform.",
      error instanceof Error ? error.message : error
    );
    return {
      name: "react-jsx-fallback",
      config() {
        return {
          esbuild: {
            jsx: "automatic",
            jsxImportSource: "react"
          }
        };
      }
    };
  }
}
var vite_config_default = defineConfig(async () => {
  const reactPlugin = await resolveReactPlugin();
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins: reactPlugin ? [reactPlugin] : [],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZVJlYWN0UGx1Z2luKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHsgZGVmYXVsdDogcmVhY3QgfSA9IGF3YWl0IGltcG9ydChcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiKTtcbiAgICByZXR1cm4gcmVhY3QoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3YyBmYWlsZWQgdG8gbG9hZDsgZmFsbGluZyBiYWNrIHRvIGEgbWluaW1hbCBKU1ggdHJhbnNmb3JtLlwiLFxuICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcixcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFwicmVhY3QtanN4LWZhbGxiYWNrXCIsXG4gICAgICBjb25maWcoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXNidWlsZDoge1xuICAgICAgICAgICAganN4OiBcImF1dG9tYXRpY1wiLFxuICAgICAgICAgICAganN4SW1wb3J0U291cmNlOiBcInJlYWN0XCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcmVhY3RQbHVnaW4gPSBhd2FpdCByZXNvbHZlUmVhY3RQbHVnaW4oKTtcblxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICB9LFxuICAgIHBsdWdpbnM6IHJlYWN0UGx1Z2luID8gW3JlYWN0UGx1Z2luXSA6IFtdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVzYnVpbGQ6IHtcbiAgICAgIGpzeDogXCJhdXRvbWF0aWNcIixcbiAgICAgIGpzeEltcG9ydFNvdXJjZTogXCJyZWFjdFwiLFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxVQUFVO0FBRGpCLElBQU0sbUNBQW1DO0FBR3pDLGVBQWUscUJBQXFCO0FBQ2xDLE1BQUk7QUFDRixVQUFNLEVBQUUsU0FBUyxNQUFNLElBQUksTUFBTSxPQUFPLDBCQUEwQjtBQUNsRSxXQUFPLE1BQU07QUFBQSxFQUNmLFNBQVMsT0FBTztBQUNkLFlBQVE7QUFBQSxNQUNOO0FBQUEsTUFDQSxpQkFBaUIsUUFBUSxNQUFNLFVBQVU7QUFBQSxJQUMzQztBQUVBLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLFNBQVM7QUFDUCxlQUFPO0FBQUEsVUFDTCxTQUFTO0FBQUEsWUFDUCxLQUFLO0FBQUEsWUFDTCxpQkFBaUI7QUFBQSxVQUNuQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYSxZQUFZO0FBQ3RDLFFBQU0sY0FBYyxNQUFNLG1CQUFtQjtBQUU3QyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUyxjQUFjLENBQUMsV0FBVyxJQUFJLENBQUM7QUFBQSxJQUN4QyxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxLQUFLO0FBQUEsTUFDTCxpQkFBaUI7QUFBQSxJQUNuQjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
