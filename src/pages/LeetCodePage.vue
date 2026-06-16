<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchLeetCodeData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="leetcode" :fetch-fn="fetchLeetCodeData" />
</template>
