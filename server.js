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

app.get("/", (req, res) => {
  res.send("✅ AI Avatar backend is running");
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt text" });
    }

    console.log("🧠 开始生成 Avatar:", prompt);

    // 调用模型并读取完整输出
    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt,
        guidance: 3,
        num_inference_steps: 28,
      },
    });

    // 若是数组则取第一个元素（图片 URL）
    if (Array.isArray(output) && output.length > 0) {
      return res.json({ image: output[0], all: output });
    }

    // 若是字符串，则直接返回
    if (typeof output === "string" && output.startsWith("http")) {
      return res.json({ image: output });
    }

    // 若是流，需要先读取内容
    if (output && output.read) {
      const reader = output.getReader();
      let chunks = [];
      let done, value;
      while (!done) {
        ({ done, value } = await reader.read());
        if (value) chunks.push(Buffer.from(value));
      }
      const result = Buffer.concat(chunks).toString();
      return res.json({ result });
    }

    return res.json({ result: output });
  } catch (error) {
    console.error("❌ 生成出错:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));