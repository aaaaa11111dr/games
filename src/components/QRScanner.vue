<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

const emit = defineEmits<{
  (e: 'scan-success', data: string): void
  (e: 'scan-error', error: string): void
}>()

const scannerRef = ref<HTMLDivElement | null>(null)
const isScanning = ref(false)
const errorMessage = ref('')
const cameraError = ref(false)

let html5QrCode: Html5Qrcode | null = null

async function startScanner() {
  if (!scannerRef.value) return
  
  errorMessage.value = ''
  cameraError.value = false
  
  try {
    html5QrCode = new Html5Qrcode('qr-reader')
    
    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      onScanSuccess,
      onScanFailure
    )
    
    isScanning.value = true
  } catch (err: any) {
    console.error('Error starting scanner:', err)
    cameraError.value = true
    errorMessage.value = '无法访问摄像头，请确保已授权摄像头权限'
    emit('scan-error', errorMessage.value)
  }
}

function stopScanner() {
  if (html5QrCode && isScanning.value) {
    html5QrCode.stop().then(() => {
      isScanning.value = false
    }).catch((err) => {
      console.error('Error stopping scanner:', err)
    })
  }
}

function onScanSuccess(decodedText: string) {
  console.log('QR Code scanned:', decodedText)
  emit('scan-success', decodedText)
  stopScanner()
}

function onScanFailure(error: string) {
  // 忽略扫描失败，只在控制台记录
  console.debug('QR scan error:', error)
}

onMounted(() => {
  // 自动启动扫描
  startScanner()
})

onUnmounted(() => {
  stopScanner()
})
</script>

<template>
  <div class="qr-scanner">
    <div class="scanner-header mb-4">
      <h3 class="text-lg font-heiti font-bold">扫描 LeetCode 二维码</h3>
      <p class="text-sm text-gray-600 mt-1">请将二维码对准扫描框</p>
    </div>
    
    <div id="qr-reader" ref="scannerRef" class="w-full"></div>
    
    <div v-if="errorMessage" class="mt-4 p-3 border border-red-300 bg-red-50 text-red-700 text-sm">
      {{ errorMessage }}
    </div>
    
    <div class="mt-4 text-center">
      <button
        @click="stopScanner"
        v-if="isScanning"
        class="px-6 py-2 bg-gray-200 text-black font-heiti border border-gray-400 hover:bg-gray-300 transition-colors"
      >
        停止扫描
      </button>
      <button
        @click="startScanner"
        v-else
        class="px-6 py-2 bg-black text-white font-heiti border border-black hover:bg-gray-800 transition-colors"
      >
        重新扫描
      </button>
    </div>
  </div>
</template>

<style scoped>
.qr-scanner {
  @apply p-4 border border-gray-300 bg-white;
}

#qr-reader {
  @apply mx-auto;
  max-width: 300px;
}

#qr-reader video {
  @apply rounded;
  border: 2px solid #000;
}
</style>
