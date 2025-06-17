// server.js
import express from "express";
import cors from "cors";
import https from "https";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Buffer } from "node:buffer";

const app = express();
app.use(cors());
// app.use(express.json());
// app.use(json()); // penting biar body JSON bisa diproses

app.use(
  "/api",
  createProxyMiddleware({
    target: "https://api-gateway.ubpkarawang.ac.id",
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
    selfHandleResponse: false,
    onProxyReq: (proxyReq, req, res) => {
      if (
        req.method === "POST" &&
        req.headers["content-type"]?.includes("application/json")
      ) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  })
);

// app.use("/api", createProxyMiddleware({
//   target: "https://api-gateway.ubpkarawang.ac.id",
//   changeOrigin: true,
//   pathRewrite: { "^/api": "" },
//   logLevel: "debug", // <--- DEBUGGING
//   onError(err, req, res) {
//     console.error("🔥 Proxy Error:", err);
//     res.status(500).send("Internal Server Error from proxy");
//   }
// }));

app.post("/api/login-ubp", async (req, res) => {
  try {
    const response = await fetch("https://api-gateway.ubpkarawang.ac.id/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.text(); // pake text karena bisa HTML kadang
    res.status(response.status).send(data);
  } catch (err) {
    console.error("🔥 Login proxy error:", err);
    res.status(500).send("Gagal login");
  }
});

app.get("/banner", (req, res) => {
  https.get("https://api-gateway.ubpkarawang.ac.id/apps/dashboard/banner-akademik", (apiRes) => {
    let data = "";

    apiRes.on("data", chunk => {
      data += chunk;
    });

    apiRes.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        const imageUrl = parsed?.data;

        if (!imageUrl) {
          return res.status(500).send("URL gambar tidak ditemukan");
        }

        // Fetch gambarnya dan langsung stream ke client
        https.get(imageUrl, imgRes => {
          res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/jpeg");
          res.setHeader("Cache-Control", "no-store");
          imgRes.pipe(res);
        }).on("error", () => {
          res.status(500).send("Gagal ambil gambar");
        });

      } catch (e) {
        res.status(500).send("Response banner tidak valid");
      }
    });
  }).on("error", () => {
    res.status(500).send("Gagal ambil data banner");
  });
});

// 🔥 Start server
app.listen(3333, () => console.log("Proxy ready: http://localhost:3333"));
