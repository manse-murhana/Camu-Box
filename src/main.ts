import "./polyfills";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import BasePanel from "./components/BasePanel.vue";
import BaseCard from "./components/BaseCard.vue";
import "./assets/styles/app.css";

const app = createApp(App);

app.component("BasePanel", BasePanel);
app.component("BaseCard", BaseCard);

app.use(createPinia());
app.use(router);
app.mount("#app");