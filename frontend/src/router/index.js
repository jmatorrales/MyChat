import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const routes = [
  // --- ZONA PÚBLICA (layout con NavPublic) ---
  {
    path: "/",
    component: () => import("../views/basic/Home.vue"), // layout público
    children: [
      {
        path: "",
        name: "index",
        component: () => import("../views/basic/Index.vue"),
      },
      {
        path: "login",
        name: "login",
        component: () => import("../views/basic/Login.vue"),
      },
      {
        path: "register",
        name: "register",
        component: () => import("../views/basic/Register.vue"),
      },
    ],
  },

  // --- ZONA USER ---
  {
    path: "/app",
    component: () => import("../views/logedUsers/UserLogedLayout.vue"),
    meta: { requiresAuth: true }, // ya no hace falta distinguir "role", solo estar logueado
    children: [
      {
        path: "",
        name: "salas",
        component: () => import("../views/logedUsers/Salas.vue"),
      },
      {
        path: "join/:roomId",
        name: "join-room",
        component: () => import("../views/logedUsers/JoinRoom.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.usuario) {
    // guardamos la ruta a la que querías ir, para volver ahí tras el login
    return { path: "/login", query: { redirect: to.fullPath } };
  }
});

export default router;