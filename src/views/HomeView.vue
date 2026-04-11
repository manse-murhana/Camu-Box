<template>
  <section class="page home-page">
    <BasePanel class="hero-section">
      <p class="eyebrow">Vue Migration</p>
      <h1>Camu-Box</h1>
      <p class="lead">
        NFC タグに MIDI を保存して、ブラウザで読み込み・再生するためのツールです。
      </p>

      <div class="feature-grid">
        <RouterLink class="feature-card-link" to="/player">
          <BaseCard size="md" class="feature-card">
            <strong>Player</strong>
            <span>NFC タグから JSON を読み取り、MIDI を再生します。</span>
          </BaseCard>
        </RouterLink>

        <RouterLink class="feature-card-link" to="/writer">
          <BaseCard size="md" class="feature-card">
            <strong>Writer</strong>
            <span>MIDI ファイルを圧縮して NFC タグに書き込みます。</span>
          </BaseCard>
        </RouterLink>
      </div>
    </BasePanel>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>