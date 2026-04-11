<template>
  <div :class="['card', cardClasses]" v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  size?: "lg" | "md" | "sm";
  gradient?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: "lg",
  gradient: false,
});

const cardClasses = computed(() => {
  const classes: string[] = [];

  if (props.size === "sm") {
    classes.push("card-sm");
  }

  if (props.gradient) {
    classes.push("card-gradient");
  }
  return classes;
});
</script>

<style scoped>
/* Styles are defined in global app.css */
</style>
