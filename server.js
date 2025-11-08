import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY, // 在 Render 中配置 Environment Variable
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
      return res.status(400).json({ error: "Missing prompt text" });
    }

    console.log("🧠 开始生成 Avatar:", prompt);

    // 调用模型
    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt,
        guidance: 3,
        num_inference_steps: 28,
      },
    });

    console.log("✅ 原始输出:", output);

    // 直接把输出返回给客户端
    if (Array.isArray(output) && output.length > 0) {
      // Replicate 通常返回图片 URL 数组
      return res.json({ image: output[0], all: output });
    }

    if (typeof output === "string" && output.startsWith("http")) {
      return res.json({ image: output });
    }

    return res.json({ result: output });
  } catch (error) {
    console.error("❌ 生成出错:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// Render 动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));