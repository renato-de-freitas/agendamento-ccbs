import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/suggestions", async (req, res) => {
    try {
      const { requisitante, setor } = req.body;
      if (!requisitante || !setor) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Como um assistente académico da UFCG CCBS, sugira um título criativo e 3 tópicos de organização para um evento solicitado por ${requisitante} do setor ${setor}. Responda estritamente em formato JSON: {"titulo": "...", "sugestoes": ["...", "...", "..."]}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let text = response.text || "{}";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      return res.json(JSON.parse(text));
    } catch (error) {
      console.error("Erro na chamada da IA:", error);
      res.status(500).json({ error: "Erro ao gerar sugestões." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
