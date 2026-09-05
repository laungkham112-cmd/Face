<template>
  <div class="container">
    <div class="header">
      <h1>AI 换脸工作室</h1>
      <p>由先进人工智能模型驱动的下一代换脸技术</p>
    </div>

    <div class="main-card">
      <div class="control-panel">
        <div class="upload-section">
          <label class="section-title">1. 上传原始图像（底图）</label>
          <div class="drop-zone" @click="triggerInput('source')">
            <input type="file" ref="sourceInput" class="hidden-input" @change="handleFileChange($event, 'source')" accept="image/*" />
            <div v-if="!sourcePreview" class="zone-placeholder">
              <span class="icon">🖼️</span>
              <span class="text">点击上传背景底图</span>
            </div>
            <img v-else :src="sourcePreview" class="preview-img" />
          </div>
        </div>

        <div class="upload-section">
          <label class="section-title">2. 上传目标人脸（要使用的人脸）</label>
          <div class="drop-zone" @click="triggerInput('target')">
            <input type="file" ref="targetInput" class="hidden-input" @change="handleFileChange($event, 'target')" accept="image/*" />
            <div v-if="!targetPreview" class="zone-placeholder">
              <span class="icon">👤</span>
              <span class="text">点击上传目标人脸</span>
            </div>
            <img v-else :src="targetPreview" class="preview-img" />
          </div>
        </div>

        <button 
          class="submit-btn" 
          @click="startFaceSwap" 
          :disabled="isLoading || !sourcePreview || !targetPreview"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? '处理中...' : '开始生成 (消耗 1 点数)' }}
        </button>
      </div>

      <div class="result-panel">
        <div v-if="!resultImage && !isLoading" class="result-placeholder">
          <span class="magic-icon">🪄</span>
          <p>您的杰作将显示在此处</p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="pulse-circle">🤖</div>
          <p class="loading-text">提取面部特征……</p>
          <p class="sub-loading-text">通常需要 5-15 秒</p>
        </div>

        <div v-if="resultImage && !isLoading" class="success-state">
          <span class="success-tag">✨ 生成成功</span>
          <img :src="resultImage" class="final-img" />
          <a :href="resultImage" download="faceswap-result.png" class="download-btn">下载超清图片</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const sourceInput = ref(null)
const targetInput = ref(null)
const sourcePreview = ref('')
const targetPreview = ref('')
const isLoading = ref(false)
const resultImage = ref('')

let sourceBase64 = ''
let targetBase64 = ''

const triggerInput = (type) => {
  if (type === 'source') sourceInput.value.click()
  if (type === 'target') targetInput.value.click()
}

const handleFileChange = (event, type) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    if (type === 'source') {
      sourcePreview.value = e.target.result
      sourceBase64 = e.target.result
    } else {
      targetPreview.value = e.target.result
      targetBase64 = e.target.result
    }
  }
  reader.readAsDataURL(file)
}

const startFaceSwap = async () => {
  isLoading.value = true
  resultImage.value = ''

  try {
    // 💡 核心改动：这里强行使用你生成的最长公网完整生产环境 API 地址，不再使用相对路径！
    const response = await fetch('https://vercel.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceImage: sourceBase64,
        targetImage: targetBase64
      })
    })

    const data = await response.json()
    
    if (response.ok && data.output) {
      resultImage.value = data.output
    } else {
      alert('生成失败: ' + (data.error || '未返回有效数据'))
    }
  } catch (error) {
    console.error(error)
    alert('Network Error, please try again.')
  } final {
    isLoading.value = false
  }
}
</script>

<style scoped>
.container { min-height: 100vh; background-color: #fafafa; font-family: -apple-system, sans-serif; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; }
.header { text-align: center; margin-bottom: 40px; }
.header h1 { font-size: 2.2rem; color: #111; font-weight: 700; margin-bottom: 8px; }
.header p { color: #666; font-size: 0.95rem; }
.main-card { width: 100%; max-width: 900px; background: #ffffff; border: 1px solid #eef0f2; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); display: flex; flex-wrap: wrap; overflow: hidden; }
.control-panel { flex: 1; min-width: 320px; padding: 32px; border-right: 1px solid #eef0f2; display: flex; flex-direction: column; gap: 24px; }
.result-panel { flex: 1; min-width: 320px; padding: 32px; background: #fafbfc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
.section-title { display: block; font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 8px; text-transform: uppercase; }
.drop-zone { border: 2px dashed #e2e8f0; border-radius: 12px; height: 160px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #fff; overflow: hidden; }
.preview-img { width: 100%; height: 100%; object-fit: contain; }
.zone-placeholder { text-align: center; display: flex; flex-direction: column; gap: 6px; }
.submit-btn { width: 100%; padding: 14px; background: #111; color: #fff; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.submit-btn:disabled { background: #cbd5e0; cursor: not-allowed; }
.result-placeholder { text-align: center; color: #a0aec0; }
.magic-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
.loading-state { text-align: center; }
.pulse-circle { width: 64px; height: 64px; background: #e0f2fe; color: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 16px; }
.success-state { width: 100%; display: flex; flex-direction: column; align-items: center; }
.final-img { max-width: 100%; max-height: 360px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); margin-bottom: 16px; }
.download-btn { padding: 10px 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; color: #2d3748; text-decoration: none; font-size: 0.85rem; }
.spinner { width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
