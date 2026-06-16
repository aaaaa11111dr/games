<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchNowcoderData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="nowcoder" :fetch-fn="fetchNowcoderData" />
</template>
