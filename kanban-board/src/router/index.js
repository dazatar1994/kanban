import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '@/components/Dashboard.vue';
import Login from '@/components/Login.vue';
import AdminDashboard from '@/components/AdminDashboard.vue'; // Убедитесь, что этот компонент существует
import UserDashboard from '@/components/UserDashboard.vue'; // Убедитесь, что этот компонент существует
import authService from '@/services/authService';
import Register from "@/components/Register.vue";

const routes = [
  { path: '/', name: 'Login', component: Login },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiredRole: 'admin' },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
  },
  {
    path: '/user',
    name: 'UserDashboard',
    component: UserDashboard,
    meta: { requiresAuth: true, requiredRole: 'user' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = authService.getToken();
    if (!token) {
      next('/');
    } else {
      const userRole = authService.getUserRole();
      if (to.meta.requiredRole && to.meta.requiredRole !== userRole) {
        alert('Доступ запрещен!');
        next('/');
      } else {
        next();
      }
    }
  } else {
    next();
  }
});

export default router;
