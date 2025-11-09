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

    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      { input: { prompt } }
    );

    let imageUrl = null;
    let base64Image = null;

    // 如果返回是流或迭代器，读取流内容为字符串
    if (output && (typeof output[Symbol.asyncIterator] === "function")) {
      let chunks = "";
      for await (const chunk of output) {
        chunks += chunk.toString();
      }
      // 尝试从文本中提取 URL 或 base64
      const urlMatch = chunks.match(/https:\/\/replicate\.delivery\/[^\s"]+/);
      const base64Match = chunks.match(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/);
      if (urlMatch) imageUrl = urlMatch[0];
      else if (base64Match) imageUrl = base64Match[0];
    } else if (Array.isArray(output) && output.length > 0) {
      if (typeof output[0] === "string" && output[0].startsWith("http")) {
        imageUrl = output[0];
      } else if (output[0].url) {
        imageUrl = output[0].url;
      } else if (output[0].base64) {
        base64Image = output[0].base64;
      }
    } else if (typeof output === "string" && output.startsWith("http")) {
      imageUrl = output;
    }

    if (!imageUrl && base64Image) {
      imageUrl = `data:image/png;base64,${base64Image}`;
    }

    if (!imageUrl) {
      return res.status(500).send("❌ 没有生成有效的图片");
    }

    // 返回一个可以直接在浏览器查看的 HTML 页面
    const html = `
      <!DOCTYPE html>
      <html lang="zh">
        <head><meta charset="UTF-8"><title>生成的头像</title></head>
        <body style="text-align:center; background:#111; color:white;">
          <h2>生成结果</h2>
          <img src="${imageUrl}" style="max-width:90%; border:5px solid white;">
        </body>
      </html>`;
    res.send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send(`❌ 生成失败: ${error.message}`);
  }
});

// Render 要求动态端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API Server running on port ${PORT}`)
);