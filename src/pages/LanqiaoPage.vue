<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchLanqiaoData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="lanqiao" :fetch-fn="fetchLanqiaoData" />
</template>
