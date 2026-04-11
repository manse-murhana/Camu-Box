<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const pageClassName = computed(() => `route-${String(route.name ?? "unknown")}`);
</script>

<template>
  <div class="app-shell" :class="pageClassName">
    <header class="shell-header">
      <RouterLink class="brand-link" to="/">
        <span class="brand-mark">C</span>
        <span class="brand-copy">
          <strong>Camu-Box</strong>
          <small>NFC MIDI toolkit</small>
        </span>
      </RouterLink>

      <nav class="shell-nav" aria-label="Primary">
        <RouterLink to="/player">Player</RouterLink>
        <RouterLink to="/writer">Writer</RouterLink>
      </nav>
    </header>

    <main class="shell-main">
      <RouterView />
    </main>

    <footer class="shell-footer page-footer">
      <RouterLink to="/">Top</RouterLink>
      <span>/</span>
      <a href="./terms.html" target="_blank" rel="noopener">利用規約</a>
      <span>/</span>
      <a
        href="https://github.com/Manse-Murhana/Camu-Box"
        target="_blank"
        rel="noopener"
      >
        GitHub
      </a>
    </footer>
  </div>
</template>