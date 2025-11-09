import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Replicate 客户端
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

// 健康检查
app.get("/", (req, res) => {
  res.send("✅ AI Avatar backend is running");
});

// 生成头像接口
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("🧠 开始生成: ", prompt);

    // 调用 Replicate 模型
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 7,
        },
      }
    );

    console.log("✅ 原始输出:", output);

    let image;

    // 情况1：直接返回了一个 URL
    if (Array.isArray(output) && typeof output[0] === "string") {
      image = output[0];
    }
    // 情况2：返回的是 Uint8Array（字节流）
    else if (Array.isArray(output) && output[0] instanceof Uint8Array) {
      const buffer = Buffer.from(output[0]);
      image = `data:image/png;base64,${buffer.toString("base64")}`;
    }
    // 情况3：返回的是对象或嵌套
    else if (output && output.image) {
      image = output.image;
    } else {
      image = output; // 兜底
    }

    res.json({ image });
  } catch (err) {
    console.error("❌ 生成失败:", err);
    res.status(500).json({ error: "Generation failed", details: err.message });
  }
});

// Render 要求动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});