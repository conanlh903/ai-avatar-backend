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
  auth: process.env.REPLICATE_API_TOKEN, // 注意变量名
});

// 简单健康检查
app.get("/", (req, res) => {
  res.send("AI Avatar backend is running ✅");
});

// 生成图片接口
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt || "a cyberpunk portrait, highly detailed";

    console.log("🧠 开始生成 Avatar, prompt:", prompt);

    const input = { prompt, prompt_upsampling: true };
    const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

    console.log("✅ 生成成功:", output);

    // 如果 output 是数组（Replicate 的 Node SDK 当前行为）
    const imageUrl = Array.isArray(output) ? output[0] : output;

    res.json({ image: imageUrl });
  } catch (error) {
    console.error("❌ 生成出错:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// Render 要求动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));