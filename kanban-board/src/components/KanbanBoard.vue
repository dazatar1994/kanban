<template>
	<!-- Модальное окно для удаления задачи -->
	<div v-if="dialogDeleteTask" class="modal-overlay" @click.self="closeTaskDialog">
		<div class="modal-window">
			<h3>Удалить задачу</h3>
			<p>Вы уверены, что хотите удалить эту задачу?</p>
			<div class="modal-buttons">
				<button class="cancel-btn" @click="closeTaskDialog">Отмена</button>
				<button class="delete-btn" @click="confirmDeleteTask">Удалить</button>
			</div>
		</div>
	</div>

	<!-- Модальное окно для удаления колонки -->
	<div v-if="dialogDeleteColumn" class="modal-overlay" @click.self="closeColumnDialog">
		<div class="modal-window">
			<h3>Удалить колонку</h3>
			<p>Вы уверены, что хотите удалить эту колонку и все её задачи?</p>
			<div class="modal-buttons">
				<button class="cancel-btn" @click="closeColumnDialog">Отмена</button>
				<button class="delete-btn" @click="confirmDeleteColumn">Удалить</button>
			</div>
		</div>
	</div>
	<!-- Кнопка для отображения/скрытия панели управления -->
	<button class="action-btn" @click="toggleControlPanel">
		{{ showControlPanel ? 'Скрыть панель управления' : 'Показать панель управления' }}
	</button>

	<!-- Панель управления, которая скрыта/показывается в зависимости от состояния showControlPanel -->
	<div v-if="showControlPanel" class="control-panel">
		<!-- Блок управления темой и архивом -->
		<div class="actions-bar">
			<button class="action-btn" @click="toggleTheme">
				{{ isDarkTheme ? 'Светлая тема' : 'Тёмная тема' }}
			</button>
			<button class="action-btn" @click="toggleArchiveView">
				Просмотр архивированных задач
			</button>

			<!-- Модальное окно архивированных задач -->
			<div v-if="showArchivedTasks" class="modal-overlay" @click.self="toggleArchiveView">
				<div class="modal-window">
					<h3>Архивированные задачи</h3>
					<ul class="archived-list">
						<li v-for="task in archivedTasks" :key="task.id" class="archived-task">
							{{ task.title }}
							<button class="action-btn restore-btn" @click="restoreTask(task.id)">Восстановить</button>
						</li>
					</ul>
					<button class="close-btn" @click="toggleArchiveView">Закрыть</button>
				</div>
			</div>
		</div>

		<!-- Блок сортировки задач -->
		<div class="sorting-section">
			<button class="action-btn" @click="sortTasksByPriority">Сортировать по приоритету</button>
			<span v-if="isSorted" class="sorted-label">Задачи отсортированы</span>
		</div>

		<!-- Блок ввода пользователя и роли -->
		<div class="user-section">
			<input v-model="username" placeholder="Введите имя пользователя" class="username-input" />
			<p>Текущая роль: <strong>{{ currentRole }}</strong></p>
		</div>

		<div class="progress-container">
			<div class="progress-header">
				<h4>Прогресс выполнения</h4>
				<span class="progress-percentage">{{ progress }}%</span>
			</div>
			<div class="progress-bar">
				<div class="progress" :style="{ width: progress + '%' }"></div>
			</div>
			<p class="progress-text">{{ progress }}% выполнено</p>
		</div>

		<!-- Блок фильтров задач -->
		<div class="filters-container">
			<div class="filter-block">
				<label for="statusFilter" class="filter-label">Фильтрация по статусу:</label>
				<select v-model="statusFilter" id="statusFilter" class="filter-select">
					<option value="">Все задачи</option>
					<option value="urgent">Срочно</option>
					<option value="soon">Как можно скорее</option>
					<option value="not-urgent">Не срочно</option>
				</select>
			</div>

			<div class="filter-block">
				<label for="taskFilter" class="filter-label">Поиск задач:</label>
				<input v-model="taskFilter" id="taskFilter" placeholder="Введите текст для поиска"
					class="filter-input" />
			</div>
		</div>
	</div>


	<div class="kanban-board">
		<div v-for="(column, columnIndex) in filteredColumns" :key="column.id" class="kanban-column" :style="{
			backgroundColor: column.color || '#f4f4f4',
			color: column.textColor || '#000',
		}">
			<div class="kanban-column-header">
				<span v-if="column.icon" class="column-icon">
					<i :class="column.icon"></i>
				</span>
				<input class="column-title" type="text" v-model="columns[columnIndex].title"
					@blur="saveColumn(columnIndex)" :style="{ color: columns[columnIndex].textColor || '#000000' }" />
			</div>


			<div v-if="isAdmin" class="color-picker">
				<label for="color">Цвет:</label>
				<input type="color" id="color" v-model="columns[columnIndex].color" @change="saveColumn(columnIndex)" />
			</div>

			<div v-if="isAdmin" class="text-color-picker">
				<label for="text-color">Цвет текста заголовка:</label>
				<input type="color" id="text-color" v-model="columns[columnIndex].textColor"
					@change="saveColumn(columnIndex)" />
			</div>

			<div v-if="isAdmin" class="icon-picker">
				<label for="iconSelect">Выберите иконку:</label>
				<select id="iconSelect" v-model="columns[columnIndex].icon" @change="saveColumn(columnIndex)">
					<option value="">Нет иконки</option>
					<option value="fas fa-star">Звезда</option>
					<option value="fas fa-heart">Сердце</option>
					<option value="fas fa-check">Галочка</option>
					<option value="fas fa-lightbulb">Идея</option>
					<option value="fas fa-user">Пользователь</option>
				</select>
			</div>

			<draggable v-model="column.tasks" :group="'tasks-group'" @end="onDragEnd" :data-column-id="column.id"
				class="kanban-tasks" :item-key="'id'" :animation="200">
				<template #item="{ element, index }">
					<div class="kanban-task" :status="element.status"
						:class="{ 'current-user-task': element.assignee === username }">
						<div class="task-info">
							<textarea class="task-title" v-model="element.title" @input="adjustHeight($event)"
								@blur="saveTask(columnIndex, index)" rows="1" maxlength="255"></textarea>
							<p class="task-created-by">Создано: {{ element.createdBy }}</p>
							<p class="task-assignee">Назначено: <strong>{{ element.assignee }}</strong></p>
						</div>

						<div class="assign-container">
							<label for="assignee">Назначить:</label>
							<select v-model="element.assignee" @change="updateAssignee(columnIndex, index)">
								<option :value="username">{{ username }} (Вы)</option>
								<option v-for="user in otherUsers" :key="user" :value="user">{{ user }}</option>
							</select>
						</div>

						<div class="task-actions">
							<div class="task-status">
								<span v-for="status in ['urgent', 'soon', 'not-urgent']" :key="status"
									:class="['status-indicator', status]"
									@click="changeTaskStatus(columnIndex, index, status)" :title="status"
									:style="{ opacity: element.status === status ? 1 : 0.6 }"></span>
							</div>
							<button class="action-btn delete-btn" @click="openDeleteTaskDialog(columnIndex, index)">
								Удалить
							</button>
							<button class="action-btn archive-button"
								@click="archiveTask(columnIndex, index)">Архивировать</button>
						</div>
					</div>
				</template>
			</draggable>

			<div class="column-actions">
				<button v-if="isActionAllowed('add')" class="action-btn add-task-btn" @click="addTask(columnIndex)">
					Добавить задачу
				</button>
				<button v-if="isActionAllowed('delete')" class="action-btn delete-column-btn"
					@click="openDeleteColumnDialog(columnIndex)">
					Удалить колонку
				</button>

			</div>
		</div>

		<button v-if="isAdmin" class="action-btn add-column-btn" @click="addColumn">Добавить колонку</button>
	</div>

</template>

<script>
import '@/assets/styles/KanbanBoard.css';
import draggable from 'vuedraggable';
import '@fortawesome/fontawesome-free/css/all.css';
import authService from '@/services/authService';


export default {
	components: {
		draggable,
	},
	data() {
		return {
			username: 'admin', // Для тестирования
			taskFilter: '',
			statusFilter: '',
			columns: [], // Данные загружаются с сервера
			ws: null, // WebSocket соединение
			isDarkTheme: false, // Состояние текущей темы
			showArchivedTasks: false,
			archivedTasks: [],
			isSorted: false,
			otherUsers: ['user1', 'user2', 'user3'], // Список других пользователей
			showControlPanel: false, // Состояние панели управления
			dialogDeleteTask: false,
			dialogDeleteColumn: false,
			taskToDelete: null,
			columnToDelete: null,
			currentRole: null, // Текущая роль пользователя



		};
	},
	methods: {
		getAuthHeaders() {
			const token = localStorage.getItem('token');
			return {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': 'Bearer ' + token } : {})
			};
		},
		openDeleteTaskDialog(columnIndex, taskIndex) {
			this.taskToDelete = { columnIndex, taskIndex };
			this.dialogDeleteTask = true;
		},
		closeTaskDialog() {
			this.dialogDeleteTask = false;
			this.taskToDelete = null;
		},
		async confirmDeleteTask() {
			if (!this.taskToDelete) return;
			const { columnIndex, taskIndex } = this.taskToDelete;
			try {
				await this.deleteTask(columnIndex, taskIndex); // Метод для удаления задачи
			} catch (error) {
				console.error('Ошибка при удалении задачи:', error);
			}
			this.closeTaskDialog();
		},
		openDeleteColumnDialog(columnIndex) {
			this.columnToDelete = columnIndex;
			this.dialogDeleteColumn = true;
		},
		closeColumnDialog() {
			this.dialogDeleteColumn = false;
			this.columnToDelete = null;
		},
		async confirmDeleteColumn() {
			if (this.columnToDelete === null) return;
			try {
				await this.deleteColumn(this.columnToDelete); // Метод для удаления колонки
			} catch (error) {
				console.error('Ошибка при удалении колонки:', error);
			}
			this.closeColumnDialog();
		},

		toggleControlPanel() {
			this.showControlPanel = !this.showControlPanel;
		},
		async restoreTask(taskId) {
			try {
				const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/restore`, {
					method: 'PUT',
					headers: this.getAuthHeaders(),
				});
				if (!response.ok) throw new Error('Ошибка при восстановлении задачи из архива');

				this.archivedTasks = this.archivedTasks.filter(task => task.id !== taskId);
				await this.fetchColumns();
			} catch (error) {
				console.error('Ошибка при восстановлении задачи:', error);
			}
		},
		async updateAssignee(columnIndex, taskIndex) {
			const task = this.columns[columnIndex].tasks[taskIndex];
			const payload = {
				assignee: task.assignee || 'unassigned',
				title: task.title || 'Untitled',
				status: task.status || 'not-urgent',
				columnId: task.columnId || 0,
				order: task.order !== undefined ? task.order : 0,
			};

			try {
				const response = await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
					method: 'PUT',
					headers: this.getAuthHeaders(),
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error('Ошибка при обновлении назначения:', errorText);
				}
			} catch (error) {
				console.error('Ошибка при обновлении назначения:', error);
			}
		},
		sortTasksByPriority() {
			this.columns.forEach((column) => {
				if (Array.isArray(column.tasks)) {
					column.tasks.sort((a, b) => {
						const priorityOrder = {
							urgent: 1,
							soon: 2,
							'not-urgent': 3,
						};
						return priorityOrder[a.status] - priorityOrder[b.status];
					});
				}
			});
			this.isSorted = true; // Отображаем подсказку
		},
		changeTaskStatus(columnIndex, taskIndex, newStatus) {
			const task = this.columns[columnIndex].tasks[taskIndex];
			task.status = newStatus;
			this.saveTask(columnIndex, taskIndex); // Сохраняем изменения на сервере
		},
		toggleArchiveView() {
			this.showArchivedTasks = !this.showArchivedTasks;
			if (this.showArchivedTasks) {
				this.fetchArchivedTasks();
			}
		},
		async fetchArchivedTasks() {
			try {
				const response = await fetch('http://localhost:3000/api/tasks/archived', {
					headers: this.getAuthHeaders()
				});
				if (!response.ok) throw new Error('Ошибка при получении архивированных задач');
				this.archivedTasks = await response.json();
			} catch (error) {
				console.error('Ошибка при загрузке архивированных задач:', error);
			}
		},
		async archiveTask(columnIndex, taskIndex) {
			const taskId = this.columns[columnIndex].tasks[taskIndex].id;
			try {
				await fetch(`http://localhost:3000/api/tasks/${taskId}/archive`, {
					method: 'PUT',
					headers: this.getAuthHeaders(),
				});
			} catch (error) {
				console.error('Ошибка при архивировании задачи:', error);
			}
		},
		async submitComment(taskId, columnIndex, taskIndex) {
			const task = this.columns[columnIndex].tasks[taskIndex];
			if (!task.newComment.trim()) return;

			const comment = await this.addComment(taskId, task.newComment);
			if (comment) {
				task.comments.push(comment); // Добавляем комментарий в задачу
				task.newComment = ''; // Очищаем поле
			}
		},
		async fetchComments(taskId) {
			try {
				const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/comments`);
				if (!response.ok) throw new Error('Ошибка при получении комментариев');
				return await response.json();
			} catch (error) {
				console.error('Ошибка при загрузке комментариев:', error);
				return [];
			}
		},
		async addComment(taskId, content) {
			try {
				const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/comments`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content, createdBy: this.username }),
				});
				if (!response.ok) throw new Error('Ошибка при добавлении комментария');
				return await response.json();
			} catch (error) {
				console.error('Ошибка при добавлении комментария:', error);
			}
		},
		toggleTheme() {
			this.isDarkTheme = !this.isDarkTheme;
			document.body.classList.toggle('dark-theme', this.isDarkTheme);
			document.body.classList.toggle('light-theme', !this.isDarkTheme);

			// Сохраняем предпочтение пользователя
			localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
		},
		initializeTheme() {
			const savedTheme = localStorage.getItem('theme') || 'light';
			this.isDarkTheme = savedTheme === 'dark';
			document.body.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
		},
		initializeWebSocket() {
			this.ws = new WebSocket('ws://localhost:3000');

			this.ws.onopen = () => {
				console.log('WebSocket соединение установлено.');
			};

			this.ws.onmessage = (event) => {
				const message = JSON.parse(event.data);
				if (message.type === 'UPDATE_COLUMNS') {
					this.columns = message.data.map(column => ({
						...column,
						tasks: column.tasks.filter(task => !task.isArchived), // Исключаем архивные задачи
					}));
					console.log('Обновленные данные колонок получены через WebSocket.');
				}
				if (message.type === 'UPDATE_COMMENTS') {
					const task = this.columns.flatMap((col) => col.tasks).find((t) => t.id === message.taskId);
					if (task) {
						task.comments = message.comments;
					}
				}
			};

			this.ws.onclose = () => {
				console.log('WebSocket соединение закрыто.');
				this.reconnectWebSocket();
			};

			this.ws.onerror = (error) => {
				console.error('Ошибка WebSocket:', error);
			};
		},

		reconnectWebSocket() {
			console.log('Попытка повторного подключения WebSocket...');
			setTimeout(() => {
				this.initializeWebSocket();
			}, 5000);
		},

		isActionAllowed(action) {
			const rolesPermissions = {
				admin: ['add', 'delete', 'edit'],
				user: ['add', 'edit'],
			};
			return rolesPermissions[this.currentRole]?.includes(action);
		},
		adjustAllTaskHeights() {
			this.$nextTick(() => {
				const textareas = document.querySelectorAll('.task-title');
				textareas.forEach((textarea) => {
					textarea.style.height = 'auto';
					textarea.style.height = `${textarea.scrollHeight}px`;
				});
			});
		},
		adjustHeight(event) {
			const textarea = event.target;
			textarea.style.height = 'auto'; // Сброс текущей высоты
			textarea.style.height = `${textarea.scrollHeight}px`; // Установка новой высоты
		},

		async fetchColumns() {
			try {
				const token = localStorage.getItem('token'); // Получаем токен из LocalStorage
				const response = await fetch('http://localhost:3000/api/columns', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`, // Передаём токен
					},
				});

				if (!response.ok) {
					throw new Error('Ошибка при получении колонок');
				}

				const data = await response.json();

				this.columns = data.map((column) => ({
					...column,
					tasks: column.tasks.filter((task) => !task.isArchived),
				}));
			} catch (error) {
				console.error('Ошибка при загрузке колонок:', error);
			}
		},

		async addColumn() {
			try {
				const newColumn = {
					title: 'Новая колонка',
					color: '#f4f4f4',
				};
				await fetch('http://localhost:3000/api/columns', {
					method: 'POST',
					headers: this.getAuthHeaders(),
					body: JSON.stringify(newColumn),
				});
			} catch (error) {
				console.error('Ошибка при добавлении колонки:', error);
			}
		},


		async deleteColumn(columnIndex) {
			const columnId = this.columns[columnIndex]?.id;
			if (!columnId) return;
			try {
				await fetch(`http://localhost:3000/api/columns/${columnId}`, {
					method: 'DELETE',
					headers: this.getAuthHeaders()
				});
			} catch (error) {
				console.error('Ошибка при удалении колонки:', error);
			}
		},

		async saveColumn(columnIndex) {
			const column = this.columns[columnIndex];

			// Проверка цветов
			if (!/^#[0-9A-Fa-f]{6}$/.test(column.color)) {
				column.color = '#ffffff';
			}
			if (!/^#[0-9A-Fa-f]{6}$/.test(column.textColor)) {
				column.textColor = '#000000';
			}

			try {
				await fetch(`http://localhost:3000/api/columns/${column.id}`, {
					method: 'PUT',
					headers: this.getAuthHeaders(),
					body: JSON.stringify({
						title: column.title,
						color: column.color,
						textColor: column.textColor,
						icon: column.icon,
					}),
				});
			} catch (error) {
				console.error('Ошибка при сохранении колонки:', error);
			}
		},
		async addTask(columnIndex) {
			try {
				const newTask = {
					title: 'Новая задача',
					status: 'not-urgent',
					createdBy: this.username,
					columnId: this.columns[columnIndex].id,
				};
				await fetch('http://localhost:3000/api/tasks', {
					method: 'POST',
					headers: this.getAuthHeaders(),
					body: JSON.stringify(newTask),
				});
			} catch (error) {
				console.error('Ошибка при добавлении задачи:', error);
			}
		},

		async saveTask(columnIndex, taskIndex) {
			const task = this.columns[columnIndex].tasks[taskIndex];
			try {
				await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
					method: 'PUT',
					headers: this.getAuthHeaders(),
					body: JSON.stringify(task),
				});
			} catch (error) {
				console.error('Ошибка при сохранении задачи:', error);
			}
		},

		async saveTask(columnIndex, taskIndex) {
			const task = this.columns[columnIndex].tasks[taskIndex];
			try {
				await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(task),
				});
			} catch (error) {
				console.error('Ошибка при сохранении задачи:', error);
			}
		},

		onDragStart(evt) {
			evt.item.classList.add('dragging');

			const taskStatus = this.columns[evt.from.dataset.columnIndex].tasks[evt.oldIndex].status;
			// Пример: разрешаем перемещать только задачи с определенным статусом
			if (taskStatus === 'urgent') {
				evt.preventDefault();
			}
		},
		onDragOver(evt) {
			evt.preventDefault();
			evt.target.classList.add('highlight');
		},
		onDragLeave(evt) {
			evt.target.classList.remove('highlight');
		},
		async onDragEnd(evt) {
			const { oldIndex, newIndex, from, to } = evt;
			const fromColumnId = from.dataset.columnId;
			const toColumnId = to.dataset.columnId;

			// Перетаскивание внутри одной колонки
			if (fromColumnId === toColumnId) {
				const fromColumnIndex = this.columns.findIndex((column) => column.id == fromColumnId);
				if (fromColumnIndex === -1) return;

				const movedTask = this.columns[fromColumnIndex].tasks.splice(oldIndex, 1)[0];
				// Вставляем задачу в новое место
				this.columns[fromColumnIndex].tasks.splice(newIndex, 0, movedTask);

				// Обновляем порядок задач в колонке
				await this.updateTaskOrder(fromColumnId, this.columns[fromColumnIndex].tasks);
			} else {
				// Перетаскивание между колонками
				const fromColumnIndex = this.columns.findIndex((column) => column.id == fromColumnId);
				const toColumnIndex = this.columns.findIndex((column) => column.id == toColumnId);

				if (fromColumnIndex === -1 || toColumnIndex === -1) return;

				const [movedTask] = this.columns[fromColumnIndex].tasks.splice(oldIndex, 1);
				this.columns[toColumnIndex].tasks.splice(newIndex, 0, movedTask);
				movedTask.columnId = toColumnId; // Обновляем колонку для задачи

				// Обновляем порядок задач в обоих столбцах
				await this.updateTaskOrder(fromColumnId, this.columns[fromColumnIndex].tasks);
				await this.updateTaskOrder(toColumnId, this.columns[toColumnIndex].tasks);

				// Сохраняем обновленную колонку и порядок задач

			}
		},

		async updateTaskOrder(columnId, tasks) {
			try {
				for (let i = 0; i < tasks.length; i++) {
					const task = tasks[i];
					task.order = i;
					const response = await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
						method: 'PUT',
						headers: this.getAuthHeaders(),
						body: JSON.stringify({
							title: task.title,
							status: task.status,
							columnId: task.columnId,
							order: task.order,
							assignee: task.assignee,
						}),
					});

					if (!response.ok) {
						const errorData = await response.json();
						console.error('Ошибка сервера при обновлении порядка задач:', errorData);
					}
				}
			} catch (error) {
				console.error('Ошибка при обновлении порядка задач:', error);
			}
		},


		onColumnDragOver(evt) {
			evt.preventDefault();  // Разрешаем перетаскивание
			evt.target.classList.add('hovered');
		},
		onColumnDragLeave(evt) {
			evt.target.classList.remove('hovered');
		},
	},

	async mounted() {
		try {
			// Получаем текущую роль пользователя
			this.currentRole = authService.getUserRole();

			if (!this.currentRole) {
				// Если роль отсутствует, перенаправляем на страницу входа
				this.$router.push('/login');
				return;
			}

			// Загружаем данные колонок
			await this.fetchColumns();

			for (const column of this.columns) {
				for (const task of column.tasks) {
					try {
						task.comments = await this.fetchComments(task.id); // Загружаем комментарии для каждой задачи
					} catch (error) {
						console.error(`Ошибка при загрузке комментариев для задачи ${task.id}:`, error);
						task.comments = []; // Если комментарии не загрузились, задаём пустой массив
					}
					task.newComment = ''; // Поле для ввода нового комментария
				}
			}

			// Инициализация WebSocket-соединения и темы
			this.initializeWebSocket();
			this.initializeTheme();
		} catch (error) {
			console.error('Ошибка при инициализации компонента KanbanBoard:', error);

			// Если что-то пошло не так, можно перенаправить пользователя на страницу ошибки или входа
			this.$router.push('/error');
		}
	},

	computed: {
		progress() {
			const totalTasks = this.columns.reduce(
				(acc, column) => acc + (Array.isArray(column.tasks) ? column.tasks.length : 0),
				0
			);
			const doneColumn = this.columns.find((column) => column.title === 'Done');
			const doneTasks = doneColumn && Array.isArray(doneColumn.tasks) ? doneColumn.tasks.length : 0;
			return totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
		},
		currentRole() {
			const roles = {
				admin: 'Администратор',
				user: 'Пользователь',
			};
			return roles[this.username] || 'Гость';
		},
		isAdmin() {
			return this.currentRole === 'admin';
		},
		filteredColumns() {
			return this.columns.map((column) => ({
				...column,
				tasks: Array.isArray(column.tasks)
					? column.tasks.filter((task) => {
						const matchesStatus = !this.statusFilter || task.status === this.statusFilter;
						const matchesText =
							!this.taskFilter || task.title.toLowerCase().includes(this.taskFilter.toLowerCase());
						return matchesStatus && matchesText;
					})
					: [],
			}));
		},
	},
	created() {
		this.initializeTheme();
	},
};
</script>
