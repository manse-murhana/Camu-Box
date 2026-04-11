<template>
  <div :class="['panel', { 'panel-compact': compact }]" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
interface Props {
  compact?: boolean;
}

withDefaults(defineProps<Props>(), {
  compact: false,
});
</script>

<style scoped>
/* Styles are defined in global app.css */
</style>
