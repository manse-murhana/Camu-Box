import { createRouter, createWebHashHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import PlayerView from "../views/PlayerView.vue";
import TermsView from "../views/TermsView.vue";
import WriterView from "../views/WriterView.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/player",
      name: "player",
      component: PlayerView,
    },
    {
      path: "/writer",
      name: "writer",
      component: WriterView,
    },
    {
      path: "/terms",
      name: "terms",
      component: TermsView,
    },
  ],
});

export default router;