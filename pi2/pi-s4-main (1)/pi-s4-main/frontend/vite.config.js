// vite.config.js
export default {
  server: {
    proxy: {
      "/api": "http://localhost:8000",  // 👈 forward all /api calls to Django
    },
  },
};
