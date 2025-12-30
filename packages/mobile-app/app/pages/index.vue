<script setup>
// Redirect to welcome page
definePageMeta({
  middleware: () => {
    return navigateTo('/welcome')
  }
})
</script>

<template>
  <div></div>
</template>
