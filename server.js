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
  res.send("🚀 AI Avatar Backend is running!");
});

app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt || "anime style portrait of a young man";
    console.log("🧠 开始生成头像: ", prompt);

    // 运行 Replicate 模型
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      { 
        input: { 
          prompt: prompt,
          aspect_ratio: "1:1",
          output_format: "jpg",
          output_quality: 90
        } 
      }
    );

    console.log("📦 API返回类型:", typeof output);
    console.log("📦 API返回内容:", output);

    let imageUrl = null;

    // 处理 ReadableStream
    if (output && typeof output[Symbol.asyncIterator] === 'function') {
      console.log("🔄 检测到流式输出，开始读取...");
      const chunks = [];
      for await (const chunk of output) {
        chunks.push(chunk);
      }
      // 合并所有块，通常第一个就是 URL
      imageUrl = chunks[0];
      console.log("🖼️ 从流中提取的URL:", imageUrl);
    }
    // 如果是字符串
    else if (typeof output === "string") {
      imageUrl = output;
    } 
    // 如果是数组
    else if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    }
    // 如果是对象
    else if (output && typeof output === "object") {
      imageUrl = output.url || output[0];
    }

    console.log("✅ 最终图片URL:", imageUrl);

    if (!imageUrl) {
      console.error("❌ 无法解析图片URL");
      return res.status(500).json({ 
        error: "没有生成有效的图片",
        debug: String(output)
      });
    }

    // 返回 JSON 格式
    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt
    });

  } catch (error) {
    console.error("❌ 生成失败:", error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API Server running on port ${PORT}`)
);