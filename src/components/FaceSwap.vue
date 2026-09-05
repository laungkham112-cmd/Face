<template>
  <div class="container">
    <div class="header">
      <h1>AI Face Swap Studio</h1>
      <p>Next-generation face swapping powered by advanced AI models</p>
    </div>

    <div class="main-card">
      <!-- 左侧控制区 -->
      <div class="control-panel">
        <div class="upload-section">
          <label class="section-title">1. Upload Original Image (Base)</label>
          <div class="drop-zone" @click="triggerInput('source')">
            <input type="file" ref="sourceInput" class="hidden-input" @change="handleFileChange($event, 'source')" accept="image/*" />
            <div v-if="!sourcePreview" class="zone-placeholder">
              <span class="icon">🖼️</span>
              <span class="text">Click to upload base image</span>
            </div>
            <img v-else :src="sourcePreview" class="preview-img" />
          </div>
        </div>

        <div class="upload-section">
          <label class="section-title">2. Upload Target Face (Face to use)</label>
          <div class="drop-zone" @click="triggerInput('target')">
            <input type="file" ref="targetInput" class="hidden-input" @change="handleFileChange($event, 'target')" accept="image/*" />
            <div v-if="!targetPreview" class="zone-placeholder">
              <span class="icon">👤</span>
              <span class="text">Click to upload target face</span>
            </div>
            <img v-else :src="targetPreview" class="preview-img" />
          </div>
        </div>

        <div class="upload-section">
          <label class="section-title">Model Version</label>
          <div class="version-toggle">
            <button :class="{ active: version === 'v1' }" @click="version = 'v1'">v1 (Standard)</button>
            <button :class="{ active: version === 'v2' }" @click="version = 'v2'">v2 (Realistic)</button>
          </div>
        </div>

        <button 
          class="submit-btn" 
          @click="startFaceSwap" 
          :disabled="isLoading || !sourcePreview || !targetPreview"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Processing...' : 'Generate (1 Credit)' }}
        </button>
      </div>

      <!-- 右侧结果区 -->
      <div class="result-panel">
        <div v-if="!resultImage && !isLoading" class="result-placeholder">
          <span class="magic-icon">🪄</span>
          <p>Your masterpiece will appear here</p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="pulse-circle">🤖</div>
          <p class="loading-text">Extracting facial features...</p>
          <p class="sub-loading-text">Usually takes 5-15 seconds</p>
        </div>

        <div v-if="resultImage && !isLoading" class="success-state">
          <span class="success-tag">✨ Generated Successfully</span>
          <img :src="resultImage" class="final-img" />
          <a :href="resultImage" download="faceswap-result.png" class="download-btn">Download HD Image</a>
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
const version = ref('v2')
const isLoading = ref(false)
const resultImage = ref('')

// 用于存储发给后端的 Base64 数据
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

// 真实请求 Vercel 后端接口的函数
const startFaceSwap = async () => {
  isLoading.value = true
  resultImage.value = ''

  try {
    // 请求我们即将在下一步建立的 Vercel 后端路由 /api/swap
    const response = await fetch('/api/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceImage: sourceBase64,
        targetImage: targetBase64,
        version: version.value
      })
    })

    const data = await response.json()
    
    if (response.ok && data.output) {
      resultImage.value = data.output // 渲染 AI 换脸后的图片 URL
    } else {
      alert('AI Generation Failed: ' + (data.error || 'Unknown Error'))
    }
  } catch (error) {
    console.error(error)
    alert('Network Error, please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.container {
  min-h-screen: 100vh;
  background-color: #fafafa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header { text-align: center; margin-bottom: 40px; }
.header h1 { font-size: 2.2rem; color: #111; font-weight: 700; margin-bottom: 8px; }
.header p { color: #666; font-size: 0.95rem; }
.main-card {
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border: 1px solid #eef0f2;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
}
.control-panel { flex: 1; min-width: 320px; padding: 32px; border-right: 1px solid #f0f2filter; display: flex; flex-direction: column; gap: 24px; }
.result-panel { flex: 1; min-width: 320px; padding: 32px; background: #fafbfc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; }
.section-title { display: block; font-size: 0.85rem; font-weight: 600; color: #444; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.drop-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  background: #fff;
}
.drop-zone:hover { border-color: #0070f3; background: #f7fafc; }
.hidden-input { display: none; }
.zone-placeholder { text-align: center; display: flex; flex-direction: column; gap: 6px; }
.zone-placeholder .icon { font-size: 1.8rem; }
.zone-placeholder .text { font-size: 0.85rem; color: #718096; font-weight: 500; }
.preview-img { width: 100%; height: 100%; object-fit: contain; }
.version-toggle { display: flex; background: #edf2f7; padding: 4px; border-radius: 8px; }
.version-toggle button {
  flex: 1; border: none; padding: 8px; font-size: 0.85rem; font-weight: 500; border-radius: 6px; cursor: pointer; background: transparent; color: #4a5568; transition: all 0.2s;
}
.version-toggle button.active { background: #fff; color: #0070f3; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.submit-btn {
  width: 100%; padding: 14px; background: #111; color: #fff; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.submit-btn:hover { background: #222; transform: translateY(-1px); }
.submit-btn:disabled { background: #cbd5e0; cursor: not-allowed; transform: none; }
.result-placeholder { text-align: center; color: #a0aec0; }
.magic-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
.loading-state { text-align: center; }
.pulse-circle {
  width: 64px; height: 64px; background: #e0f2fe; color: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 16px; animation: pulse 1.5s infinite;
}
.loading-text { font-size: 0.95rem; font-weight: 600; color: #2d3748; }
.sub-loading-text { font-size: 0.8rem; color: #718096; margin-top: 4px; }
.success-state { width: 100%; display: flex; flex-direction: column; align-items: center; }
.success-tag { font-size: 0.8rem; color: #38a169; background: #f0fff4; padding: 4px 12px; border-radius: 20px; font-weight: 600; margin-bottom: 16px; }
.final-img { max-width: 100%; max-height: 360px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); margin-bottom: 16px; }
.download-btn {
  padding: 10px 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; color: #2d3748; font-size: 0.85rem; font-weight: 500; text-decoration: none; transition: all 0.2s;
}
.download-btn:hover { background: #f7fafc; border-color: #cbd5e0; }
.spinner {
  width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.4); } 70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(2, 132, 199, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); } }
</style>
