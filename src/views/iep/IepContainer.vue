<template>
  <div class="iep-iframe-container">
    <iframe 
      ref="iepIframe"
      :src="iframeSrc" 
      class="iep-frame"
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const iepIframe = ref(null)

const getHashFromRoute = () => {
  const parts = route.path.split('/')
  const viewKey = parts[2] || 'home'
  return `#/${viewKey}`
}

const iframeSrc = ref(`/iep/index.html${getHashFromRoute()}`)

watch(() => route.path, () => {
  const targetHash = getHashFromRoute()
  if (iepIframe.value && iepIframe.value.contentWindow) {
    if (iepIframe.value.contentWindow.location.hash !== targetHash) {
      iepIframe.value.contentWindow.location.hash = targetHash
    }
  }
})

onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'navigate_cockpit') {
      window.location.hash = '#/cockpit/inclusive'
    }
  })
})
</script>

<style scoped>
.iep-iframe-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f6f8fb;
}

.iep-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
