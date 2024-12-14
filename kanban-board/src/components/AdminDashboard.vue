<template>
	<div>
	  <KanbanBoard />
	</div>
  </template>
  
  <script>
    import KanbanBoard from '@/components/KanbanBoard.vue';

  export default {
	components: {
    KanbanBoard,
  },
	name: 'AdminDashboard',
	
  };
  </script>
  
  <style scoped>
  h1 {
	color: #2c3e50;
  }
  
  p {
	font-size: 16px;
  }
  </style>
  