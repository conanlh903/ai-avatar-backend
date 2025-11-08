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
  auth: process.env.REPLICATE_API_KEY, // 切记不要在代码里写死 token
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
      return res.status(400).json({ error: "Missing prompt" });
    }

    console.log("🧠 开始生成 Avatar，prompt:", prompt);

    // 调用 black‑forest‑labs/flux‑1.1‑pro 模型
    const input = {
      prompt,
      prompt_upsampling: true, // 可按模型文档需要设置额外参数
    };

    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input,
    });

    console.log("✅ 生成成功:", output);

    // 返回的 output 通常是一个图片 URL 数组
    res.json({ image: Array.isArray(output) ? output[0] : output });
  } catch (error) {
    console.error("🔥 异常:", error);
    res.status(500).json({
      error: "Generation failed",
      details: error.message,
    });
  }
});

// Render 要求使用动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));