const express = require('express');
const { syncDatabase, Column, Task, Comment, User } = require('./models');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();
const { format } = require('date-fns');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
	throw new Error('JWT_SECRET не определен. Убедитесь, что файл .env содержит эту переменную.');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

// Middleware
app.use(express.json());
app.use(cors());

// Функция для отправки данных всем клиентам через WebSocket
const broadcast = (message) => {
	const data = JSON.stringify(message);
	for (const client of clients) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	}
};

// WebSocket: обработка подключений
wss.on('connection', (ws) => {
	console.log('Клиент подключен');
	clients.add(ws);

	ws.on('close', () => {
		console.log('Клиент отключен');
		clients.delete(ws);
	});
});

// Префикс для API
const router = express.Router();

// Проверочный маршрут для API
router.get('/', (req, res) => {
	res.send('Сервер работает! Это API Kanban.');
});

// Маршрут для регистрации нового пользователя
router.post('/auth/register', async (req, res) => {
	const { username, password, role } = req.body;

	try {
		if (!username || !password || !role) {
			return res.status(400).json({ error: 'Не все обязательные поля заполнены.' });
		}

		// Проверяем наличие JWT_SECRET
		if (!process.env.JWT_SECRET) {
			throw new Error('JWT_SECRET не определён. Проверьте файл .env.');
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await User.create({ username, password: hashedPassword, role });

		const token = jwt.sign(
			{ id: user.id, role: user.role, username: user.username }, // Добавляем username
			JWT_SECRET,
			{ expiresIn: '1h' }
		);

		res.status(201).json({ message: 'Пользователь зарегистрирован.', token });
	} catch (error) {
		console.error('Ошибка при регистрации:', error);
		res.status(500).json({ error: 'Ошибка при регистрации пользователя.' });
	}
});


router.get('/users', async (req, res) => {
	try {
		const users = await User.findAll({ attributes: ['id', 'username'] }); // Только id и username
		res.json(users);
	} catch (error) {
		console.error('Ошибка при получении пользователей:', error);
		res.status(500).json({ error: 'Ошибка при получении списка пользователей.' });
	}
});


// Маршрут для авторизации пользователя
router.post('/auth/login', async (req, res) => {
	const { username, password } = req.body;

	try {
		const user = await User.findOne({ where: { username } });
		if (!user) {
			return res.status(400).json({ error: 'Неверный логин или пароль.' });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ error: 'Неверный логин или пароль.' });
		}

		const token = jwt.sign(
			{ id: user.id, role: user.role, username: user.username }, // Добавляем username
			JWT_SECRET,
			{ expiresIn: '1h' }
		); res.json({ token });
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при авторизации пользователя.' });
	}
});

// Middleware для проверки токена и авторизации роли
const authenticateToken = (req, res, next) => {
	const token = req.headers['authorization']?.split(' ')[1];
	if (!token) return res.status(403).json({ error: 'Токен не найден.' });

	jwt.verify(token, JWT_SECRET, (err, user) => {
		if (err) {
			console.error('Ошибка валидации токена:', err.message);
			return res.status(403).json({ error: 'Неверный токен.' });
		}
		console.log('Аутентифицированный пользователь:', user);
		req.user = user;
		next();
	});
};


const authorizeRole = (role) => {
	return (req, res, next) => {
		console.log('Проверка роли пользователя:', req.user.role);
		if (req.user.role !== role) {
			console.error('Нет доступа для роли:', req.user.role);
			return res.status(403).json({ error: 'Нет доступа' });
		}
		next();
	};
};

// Маршрут для получения всех колонок и задач
router.get('/columns', authenticateToken, async (req, res) => {
	try {
		console.log('Получение колонок...');
		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		console.log('Колонки получены:', columns);
		res.json(columns);
	} catch (error) {
		console.error('Ошибка при получении колонок:', error);
		res.status(500).json({ error: 'Ошибка при получении колонок.' });
	}
});


router.post('/columns/set-done', authenticateToken, authorizeRole('admin'), async (req, res) => {
	const { columnId } = req.body;

	try {
		// Устанавливаем все колонки как "не Done"
		await Column.update({ isDone: false }, { where: {} });

		// Если передан columnId, устанавливаем его как "Done"
		if (columnId) {
			const column = await Column.findByPk(columnId);
			if (!column) return res.status(404).json({ error: 'Колонка не найдена' });

			column.isDone = true;
			await column.save();
		}

		res.json({ message: 'Статус Done обновлен' });
	} catch (error) {
		console.error('Ошибка при обновлении Done-колонки:', error);
		res.status(500).json({ error: 'Ошибка при обновлении Done-колонки' });
	}
});


// Маршрут для создания новой колонки
router.post('/columns', authenticateToken, authorizeRole('admin'), async (req, res) => {
	try {
		const { title, color } = req.body;
		const column = await Column.create({ title, color });
		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.status(201).json(column);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при создании колонки.' });
	}
});

// Маршрут для обновления колонки
router.put('/columns/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
	const { id } = req.params;
	const { title, color, textColor, icon } = req.body;

	try {
		const column = await Column.findByPk(id);
		if (!column) {
			return res.status(404).json({ error: 'Колонка не найдена' });
		}

		column.title = title;
		column.color = color;
		column.textColor = textColor || column.textColor;
		column.icon = icon || column.icon;
		await column.save();

		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.json(column);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при обновлении колонки.' });
	}
});


// Маршрут для удаления колонки
router.delete('/columns/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
	const { id } = req.params;

	try {
		const column = await Column.findByPk(id);
		if (!column) {
			return res.status(404).json({ error: 'Колонка не найдена' });
		}

		await column.destroy();
		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.json({ message: 'Колонка успешно удалена' });
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при удалении колонки.' });
	}
});

// Маршрут для создания новой задачи
router.post('/tasks', authenticateToken, async (req, res) => {
	try {
		const { title, status, createdBy,
			columnId, assignee, order,
			userId, startDate, dueDate,
			description } = req.body;

		const task = await Task.create({
			title, status, createdBy
			, columnId, assignee, order,
			userId, startDate, dueDate,
			description
		});
		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.status(201).json(task);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при создании задачи.' });
	}
});

// Маршрут для обновления задачи
router.put('/tasks/:id', authenticateToken, async (req, res) => {
	const { id } = req.params;
	const { title, status, columnId,
		assignee, order, userId,
		startDate, dueDate, description } = req.body;

	try {
		const task = await Task.findByPk(id);
		if (!task) {
			return res.status(404).json({ error: 'Задача не найдена' });
		}

		task.title = title;
		task.status = status;
		task.columnId = columnId;
		task.assignee = assignee;
		task.order = order;
		task.userId = userId;
		task.startDate = startDate;
		task.dueDate = dueDate;
		task.description = description;
		await task.save();

		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.json(task);
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при обновлении задачи.' });
	}
});

// Маршрут для удаления задачи
router.delete('/tasks/:id', authenticateToken, async (req, res) => {
	const { id } = req.params;

	try {
		const task = await Task.findByPk(id);
		if (!task) {
			return res.status(404).json({ error: 'Задача не найдена' });
		}

		await task.destroy();
		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.json({ message: 'Задача успешно удалена' });
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при удалении задачи.' });
	}
});

// Маршрут для архивирования задачи
router.put('/tasks/:id/archive', authenticateToken, async (req, res) => {
	const { id } = req.params;

	try {
		const task = await Task.findByPk(id);
		if (!task) {
			return res.status(404).json({ error: 'Задача не найдена' });
		}

		task.isArchived = true;
		await task.save();

		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});
		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.json({ message: 'Задача успешно архивирована' });
	} catch (error) {
		res.status(500).json({ error: 'Ошибка при архивировании задачи' });
	}
});

// Маршрут для восстановления архивированной задачи
router.put('/tasks/:id/restore', authenticateToken, async (req, res) => {
	const { id } = req.params;

	try {
		const task = await Task.findByPk(id);
		if (!task) {
			return res.status(404).json({ error: 'Задача не найдена' });
		}

		task.isArchived = false; // Восстанавливаем задачу
		await task.save();

		const columns = await Column.findAll({
			include: [{ model: Task, as: 'tasks' }],
		});

		broadcast({ type: 'UPDATE_COLUMNS', data: columns });
		res.json({ message: 'Задача успешно восстановлена.' });
	} catch (error) {
		console.error('Ошибка при восстановлении задачи:', error);
		res.status(500).json({ error: 'Ошибка при восстановлении задачи.' });
	}
});


// Маршрут для получения архивированных задач
router.get('/tasks/archived', authenticateToken, async (req, res) => {
	try {
		const archivedTasks = await Task.findAll({ where: { isArchived: true } });
		if (!archivedTasks) {
			return res.status(404).json({ error: 'Архивированные задачи не найдены' });
		}
		res.json(archivedTasks);
	} catch (error) {
		console.error('Ошибка при получении архивированных задач:', error);
		res.status(500).json({ error: 'Ошибка при получении архивированных задач' });
	}
});

// Префикс для API
app.use('/api', router);

// Синхронизация базы данных и запуск сервера
syncDatabase().then(() => {
	console.log('База данных синхронизирована.');
	console.log(`JWT_SECRET установлен: ${JWT_SECRET ? 'Да' : 'Нет'}`);
	server.listen(3000, () => {
		console.log('Сервер запущен на http://localhost:3000');
	});
});
