<template>
	<div>
	  <h1>Добро пожаловать на Kanban-доску!</h1>
	  <KanbanBoard />
	</div>
  </template>
  
  
  
  
  <script>
  import authService from '@/services/authService';
  import { useRouter } from 'vue-router';
  import KanbanBoard from '@/components/KanbanBoard.vue';

  export default {
	components: {
	  KanbanBoard,
	},
	setup() {
	  const router = useRouter();
  
	  const logout = () => {
		authService.logout();
		router.push('/');
	  };
  
	  return { logout };
	},
  };
  </script>
  