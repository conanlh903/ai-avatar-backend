import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    console.log("🧠 开始生成:", prompt);

    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: { prompt }
      }
    );

    console.log("✅ 原始输出:", output);

    let image;

    // 如果是字符串 URL
    if (Array.isArray(output) && typeof output[0] === "string") {
      image = output[0];
    }
    // 如果是流
    else if (output && output.getReader) {
      const reader = output.getReader();
      let chunks = [];
      let done, value;
      while ({ done, value } = await reader.read(), !done) {
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);
      image = `data:image/png;base64,${buffer.toString("base64")}`;
    }
    // 其他情况兜底
    else {
      image = output;
    }

    res.json({ image });
  } catch (err) {
    console.error("❌ 生成失败:", err);
    res.status(500).json({ error: "Generation failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));