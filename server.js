import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Replicate from "replicate";

// 读取环境变量
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
  res.send("🚀 AI Avatar backend is running");
});

// 生成图片接口
app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("🟢 收到生成请求 Prompt:", prompt);

    // 调用模型
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      { input: { prompt } }
    );

    console.log("🟢 typeof output:", typeof output);
    console.log("🟢 Array.isArray(output):", Array.isArray(output));
    console.log("🟢 constructor:", output?.constructor?.name);
    console.log("🟢 原始输出内容:", output);

    let imageUrl = null;
    let base64Data = null;

    // 如果返回的是数组，并且数组元素是字符串或 URL
    if (Array.isArray(output) && output.length > 0) {
      if (typeof output[0] === "string" && output[0].startsWith("http")) {
        imageUrl = output[0];
      }
    }

    // 如果直接是字符串 URL
    if (typeof output === "string" && output.startsWith("http")) {
      imageUrl = output;
    }

    // 如果是对象里有 URL
    if (typeof output === "object" && output !== null) {
      const urlField = findUrlInObject(output);
      if (urlField) {
        imageUrl = urlField;
      }
    }

    // 如果是 ReadableStream 或 Buffer
    if (output && typeof output.getReader === "function") {
      const reader = output.getReader();
      const chunks = [];
      let done, value;
      while (({ done, value } = await reader.read()) && !done) {
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);
      base64Data = buffer.toString("base64");
    } else if (Buffer.isBuffer(output)) {
      base64Data = output.toString("base64");
    }

    res.json({
      prompt,
      image: imageUrl || null,
      base64: base64Data || null,
    });
  } catch (error) {
    console.error("❌ 生成失败:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// 辅助函数：递归找 URL
function findUrlInObject(obj) {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === "string" && value.startsWith("http")) {
      return value;
    } else if (typeof value === "object" && value !== null) {
      const found = findUrlInObject(value);
      if (found) return found;
    }
  }
  return null;
}

// Render 要求动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});