<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const pageClassName = computed(() => `route-${String(route.name ?? "unknown")}`);
</script>

<template>
  <div class="app-shell" :class="pageClassName">
    <header class="shell-header">
      <div class="brand-block">
        <RouterLink class="brand-link" to="/">
          <span class="brand-mark">C</span>
          <span class="brand-copy">
            <strong>Camu-Box</strong>
            <small>NFC MIDI toolkit</small>
          </span>
        </RouterLink>
        <a
          class="brand-github"
          href="https://github.com/Manse-Murhana/Camu-Box"
          target="_blank"
          rel="noopener"
          aria-label="GitHub repository"
        >
          <img
            src="https://img.shields.io/github/stars/Manse-Murhana/Camu-Box?style=for-the-badge&logo=github&label=GitHub"
            alt="GitHub stars"
          />
        </a>
      </div>

      <nav class="shell-nav" aria-label="Primary">
        <RouterLink to="/player">Player</RouterLink>
        <RouterLink to="/writer">Writer</RouterLink>
        <RouterLink to="/terms">Terms</RouterLink>
      </nav>
    </header>

    <main class="shell-main">
      <RouterView />
    </main>
  </div>
</template>