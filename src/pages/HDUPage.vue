<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchHDUData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="hdu" :fetch-fn="fetchHDUData" />
</template>
