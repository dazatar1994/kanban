<template>
  <div>
    <h1>Добро пожаловать на Kanban-доску!</h1>
    <KanbanBoard />
  </div>
</template>

<script>
import KanbanBoard from '@/components/KanbanBoard.vue';

export default {
  components: {
    KanbanBoard,
  },
};
</script>
