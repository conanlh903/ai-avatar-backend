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
  auth: process.env.REPLICATE_API_TOKEN, // 确认 Render 环境变量名对应
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

    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      { input: { prompt } }
    );

    // 把输出的 ReadableStream 全部读取为文本或数组
    let result;
    if (output && typeof output.pipe === "function") {
      const chunks = [];
      for await (const chunk of output) {
        chunks.push(chunk);
      }
      result = Buffer.concat(chunks).toString("utf8");
      console.log("✅ 生成的文本结果:", result);
    } else {
      result = output;
      console.log("✅ 生成的结果:", result);
    }

    // 如果结果是数组，取第一项；如果是字符串，直接返回
    const imageUrl =
      Array.isArray(result) ? result[0] :
      typeof result === "string" ? result :
      null;

    res.json({ image: imageUrl ?? result });
  } catch (error) {
    console.error("❌ 生成出错:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// Render 要求动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));