const express = require('express');
const Column = require('../models/Column');
const Task = require('../models/Task');
const { broadcast } = require('../services/websocket');

const router = express.Router();

// Получение колонок и задач
router.get('/columns', async (req, res) => {
    const columns = await Column.findAll({ include: Task });
    res.json(columns);
});

// Добавление новой колонки
router.post('/columns', async (req, res) => {
    const column = await Column.create(req.body);
    broadcast({ type: 'COLUMN_ADDED', column });
    res.status(201).json(column);
});

// Добавление задачи
router.post('/tasks', async (req, res) => {
    const task = await Task.create(req.body);
    broadcast({ type: 'TASK_ADDED', task });
    res.status(201).json(task);
});

// Обновление задачи
router.put('/tasks/:id', async (req, res) => {
    const task = await Task.findByPk(req.params.id);
    if (task) {
        await task.update(req.body);
        broadcast({ type: 'TASK_UPDATED', task });
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// Удаление задачи
router.delete('/tasks/:id', async (req, res) => {
    const task = await Task.findByPk(req.params.id);
    if (task) {
        await task.destroy();
        broadcast({ type: 'TASK_DELETED', id: req.params.id });
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

module.exports = router;
