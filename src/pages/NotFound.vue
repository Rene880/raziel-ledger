<template>
  <div class="flex flex-col items-center">
    <h1 class="self-center mb-8">404 - Page not found</h1>
    <p>
      This page doesn't exist. <router-link to="/">Go back home</router-link>
    </p>
  </div>
</template>

<script>
import setHead from '@/js/head'

export default {
  mounted() {
    setHead({
      title: 'Raziel Ledger - Page not found',
    });
  }
}
</script>
