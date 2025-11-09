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

// 页面访问根路径
app.get("/", (req, res) => {
  res.send("🚀 AI Avatar Backend is running!");
});

// 生成并返回 HTML 显示图片
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt || "anime style portrait of a young man";

    console.log("🧠 开始生成头像: ", prompt);

    // 调用 Replicate 模型，这里用 flux-1.1-pro 演示
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: prompt
        }
      }
    );

    console.log("✅ 原始输出: ", output);

    let imageUrl = null;
    let base64Image = null;

    if (Array.isArray(output) && output.length > 0) {
      // 有可能直接是 URL
      if (typeof output[0] === "string" && output[0].startsWith("http")) {
        imageUrl = output[0];
      }
      // 有可能是对象内的 URL
      else if (output[0].url) {
        imageUrl = output[0].url;
      }
      // 有可能是对象内的 base64
      else if (output[0].base64) {
        base64Image = output[0].base64;
      }
    }

    // 如果没有 URL，但有 Base64
    if (!imageUrl && base64Image) {
      // 拼接成可显示的 img src
      imageUrl = `data:image/png;base64,${base64Image}`;
    }

    if (!imageUrl) {
      return res.status(500).send("❌ 没有生成有效的图片");
    }

    // 返回 HTML 页面，直接显示图片
    const html = `
      <!DOCTYPE html>
      <html lang="zh">
        <head>
          <meta charset="UTF-8">
          <title>生成的头像</title>
        </head>
        <body style="text-align:center; background-color:#111; color:white;">
          <h1>生成结果</h1>
          <img src="${imageUrl}" style="max-width:90%; height:auto; border:5px solid white;">
        </body>
      </html>
    `;
    res.send(html);

  } catch (error) {
    console.error(error);
    res.status(500).send(`❌ 生成失败: ${error.message}`);
  }
});

// Render 要求动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});