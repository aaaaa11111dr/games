<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchAtCoderData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="atcoder" :fetch-fn="fetchAtCoderData" />
</template>
