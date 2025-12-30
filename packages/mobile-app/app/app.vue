<template>
  <div id="app">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup>
// Set up app metadata
useHead({
  titleTemplate: '%s - اینفرنال',
  meta: [
    { name: 'application-name', content: 'اینفرنال' }
  ]
});
</script>

<style lang="scss">
// Global app styles are loaded from nuxt.config.ts
</style>

