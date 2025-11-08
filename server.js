import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 健康检查接口
app.get("/", (req, res) => {
  res.send("✅ AI Avatar backend is running");
});

// AI头像生成接口
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    console.log("🧠 发送请求到 Replicate，prompt:", prompt);

    // 创建生成任务
    const createResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-1.1-pro",
        input: { prompt },
      }),
    });

    const prediction = await createResp.json();
    if (!createResp.ok) {
      console.error("❌ Replicate returned error:", prediction);
      return res.status(500).json({
        error: "Failed to create prediction",
        details: prediction,
      });
    }

    // 轮询获取结果
    let status = prediction.status;
    let result = null;

    while (status !== "succeeded" && status !== "failed") {
      await new Promise((r) => setTimeout(r, 2000));
      const getResp = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: { Authorization: `Token ${process.env.REPLICATE_API_KEY}` },
        }
      );
      const updated = await getResp.json();
      status = updated.status;
      if (status === "succeeded") result = updated.output;
    }

    if (status === "succeeded" && result && result.length > 0) {
      console.log("✅ 生成成功:", result[0]);
      res.json({ image: result[0] });
    } else {
      console.error("⚠️ 生成失败或无结果:", prediction);
      res.status(500).json({
        error: "Generation failed or no output returned",
        details: prediction,
      });
    }
  } catch (error) {
    console.error("🔥 异常:", error);
    res.status(500).json({ error: "Generation failed", details: error.message });
  }
});

// ⚙️ 启动服务器（Render 要求使用动态端口）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API Server running on port ${PORT}`));