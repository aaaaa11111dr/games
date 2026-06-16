<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchLuoguData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="luogu" :fetch-fn="fetchLuoguData" />
</template>
