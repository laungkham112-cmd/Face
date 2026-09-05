export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { sourceImage, targetImage } = req.body;

    if (!sourceImage || !targetImage) {
      return res.status(400).json({ error: '请上传两张图片' });
    }

    // 1. 将前端的 Base64 转换并托管到免费公网图床（VModel 必须要图片 URL）
    async function uploadToImg(base64Data) {
      const formData = new URLSearchParams();
      const cleanBase64 = base64Data.split(',')[1] || base64Data;
      formData.append('image', cleanBase64);
      
      const res = await fetch('https://imgbb.com', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (!json.data || !json.data.url) {
        throw new Error('图片转公网URL失败');
      }
      return json.data.url;
    }

    // 同时上传两张图
    const [sourceUrl, targetUrl] = await Promise.all([
      uploadToImg(sourceImage),
      uploadToImg(targetImage)
    ]);

    // 2. 投递任务给 VModel AI 平台 (使用你文档截图里的 64 位模型版本 ID)
    const modelVersion = "9dcd6d78e7c6560c340d918fe32e9f24aebfa331e5cce85fc3ff7fb03121426";

    const createRes = await fetch('https://vmodel.ai', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VMODEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: modelVersion,
        input: {
          swap_image: sourceUrl,
          target_image: targetUrl
        }
      })
    });

    const createData = await createRes.json();
    
    if (createData.code !== 200 || !createData.result?.task_id) {
      return res.status(200).json({ error: createData.message?.zh || 'AI 平台拒绝创建任务' });
    }

    const taskId = createData.result.task_id;

    // 3. 进入状态轮询阶段
    let status = 'processing';
    let finalOutput = '';
    let attempts = 0;
    const maxAttempts = 20; 

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 每 3 秒查一次
      attempts++;

      const checkRes = await fetch(`https://vmodel.ai{taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${process.env.VMODEL_API_TOKEN}` }
      });
      
      const checkData = await checkRes.json();
      
      if (checkData.code === 200 && checkData.result) {
        status = checkData.result.status;
        if (status === 'succeeded') {
          finalOutput = checkData.result.output;
          break;
        } else if (status === 'failed') {
          return res.status(200).json({ error: checkData.result.error || 'AI 模型换脸失败' });
        }
      }
    }

    if (finalOutput) {
      const resultUrl = Array.isArray(finalOutput) ? finalOutput[0] : finalOutput;
      return res.status(200).json({ output: resultUrl });
    } else {
      return res.status(200).json({ error: 'AI 换脸超时，请稍后重试' });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
