<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchPTAData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="pta" :fetch-fn="fetchPTAData" />
</template>
