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
  auth: process.env.REPLICATE_API_KEY,
});

// 健康检查
app.get("/", (req, res) => {
  res.send("✅ AI Avatar backend is running");
});

// AI 头像生成接口
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    console.log("🧠 开始生成 Avatar:", prompt);

    // 调用 Replicate 模型（Black Forest Labs: FLUX 1.1 PRO）
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          // 这里就是你的提示语，可以自定义
          prompt,
          guidance: 3,
          num_inference_steps: 28,
        },
      }
    );

    console.log("✅ 生成结果：", output);

    // 如果返回的是数组（多数情况是图片URL数组）
    if (Array.isArray(output) && output.length > 0) {
      return res.json({ image: output[0] });
    }

    // 如果是字符串，直接返回
    if (typeof output === "string") {
      return res.json({ image: output });
    }

    // 如果是对象或可读流
    return res.json({ result: output });
  } catch (error) {
    console.error("❌ 生成出错:", error);
    res
      .status(500)
      .json({ error: "Generation failed", details: error.message });
  }
});

// Render 要求使用动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));