import { serveDir, serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve(async (req) => {
  const pathname = new URL(req.url).pathname;

  // Serve static files from 'dist' directory
  const response = await serveDir(req, {
    fsRoot: "dist",
  });

  // Handle SPA routing: if 404 (file not found) and not an API call, return index.html
  if (response.status === 404 && !pathname.startsWith("/api")) {
    return await serveFile(req, "dist/index.html");
  }

  return response;
});
