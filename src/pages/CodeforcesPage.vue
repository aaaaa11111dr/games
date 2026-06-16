<script setup lang="ts">
import OJDetailPage from '../components/OJDetailPage.vue'
import { fetchCodeforcesData } from '../api/ojApi'
</script>

<template>
  <OJDetailPage oj-id="codeforces" :fetch-fn="fetchCodeforcesData" />
</template>
