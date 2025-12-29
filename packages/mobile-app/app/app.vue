<template>
  <div id="app">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<script setup>
// Import global styles
import '~/assets/scss/main.scss';

// Set up app metadata
useHead({
  titleTemplate: '%s - اینفرنال',
  meta: [
    { name: 'application-name', content: 'اینفرنال' }
  ]
});
</script>

<style lang="scss">
// Global app styles are loaded from assets/scss/main.scss
</style>

