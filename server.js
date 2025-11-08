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
  auth: process.env.REPLICATE_API_KEY, // 请在 Render 环境变量中设置
});

// 健康检查接口
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

    // 调用指定的模型
    const output = await replicate.run("black-forest-labs/flux-1.1-pro", {
      input: {
        prompt,
        guidance: 3,
        num_inference_steps: 28,
      },
    });

    console.log("✅ 原始输出:", output);

    // 如果返回的是可读流，将流读出来
    if (output?.readable) {
      let data = "";
      for await (const chunk of output) {
        data += chunk;
      }
      try {
        const parsed = JSON.parse(data);
        return res.json(parsed);
      } catch {
        return res.json({ result: data });
      }
    }

    // 常见情况：数组或字符串
    if (Array.isArray(output) && output.length > 0) {
      return res.json({ image: output[0] });
    }
    if (typeof output === "string") {
      return res.json({ image: output });
    }

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
app.listen(PORT, () =>
  console.log(`🚀 API Server running on port ${PORT}`)
);