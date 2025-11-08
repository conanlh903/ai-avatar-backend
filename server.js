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
  auth: process.env.REPLICATE_API_TOKEN, // 确认 Render 环境变量设置一致
});

// 健康检查
app.get("/", (_, res) => {
  res.send("✅ AI Avatar backend running");
});

// 生成图片接口
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt || "a cyberpunk portrait of a young man";
    console.log("🧠 开始生成 Avatar，prompt:", prompt);

    // 调用模型
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      { input: { prompt } }
    );

    // 输出结果通常是数组或可迭代结果
    let result;

    // 当返回是可迭代的流
    if (Symbol.asyncIterator in Object(output)) {
      const chunks = [];
      for await (const chunk of output) {
        chunks.push(chunk);
      }
      result = chunks.join("");
    } else {
      result = output;
    }

    console.log("✅ 生成的结果:", result);

    // 从结果中提取图片URL
    let imageUrl = null;
    if (Array.isArray(result)) {
      imageUrl = result[0];
    } else if (typeof result === "string" && result.startsWith("http")) {
      imageUrl = result;
    } else if (result?.output && Array.isArray(result.output)) {
      imageUrl = result.output[0];
    }

    res.json({ image: imageUrl ?? result });
  } catch (error) {
    console.error("❌ 生成出错:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// 动态端口（Render要求）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));