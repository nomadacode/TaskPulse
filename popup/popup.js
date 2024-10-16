document.addEventListener('DOMContentLoaded', async () => {
  await renderTasks();

  document.getElementById('addTask').addEventListener('click', () => {
    openTaskForm();
  });

  // Event to close modal when clicking the X
  document.getElementById('closeModal').addEventListener('click', () => {
    closeTaskForm();
  });

  // Evento para descargar el reporte semanal
  document.getElementById('downloadReport').addEventListener('click', async () => {
    const csvContent = await TaskManager.generateWeeklyReport();
    TaskManager.downloadCSV(csvContent, 'reporte_semanal.csv');
  });
});

async function renderTasks() {
  const tasks = await TaskManager.getTasks();
  const taskList = document.getElementById('taskList');

  taskList.innerHTML = tasks.map(task => {
    let formattedDueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '';

    let statusText = task.status || 'Sin estado';
    let statusClass = task.status === 'Pendiente' ? 'status-pending' : task.status === 'En progreso' ? 'status-progress' : task.status === 'Completada' ? 'status-completed' : '';

    return `
      <div class="task" draggable="true" data-task-id="${task.id}">
        <div class="task-details">
          <span class="task-title">${task.title}</span>
          <span class="status-pill ${statusClass}">${statusText}</span>
          ${formattedDueDate ? `<span>Hasta: ${formattedDueDate}</span>` : ''}
        </div>
        <div>
          <button class="editTask" data-task-id="${task.id}">Editar</button>
          <button class="deleteTask" data-task-id="${task.id}">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.task').forEach(taskElement => {
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragover', handleDragOver);
    taskElement.addEventListener('drop', handleDrop);
  });

  document.querySelectorAll('.editTask').forEach(button => {
    button.addEventListener('click', async () => {
      const taskId = parseInt(button.getAttribute('data-task-id'));
      const task = await TaskManager.getTasks().then(tasks => tasks.find(t => t.id === taskId));
      openTaskForm(task);
    });
  });

  document.querySelectorAll('.deleteTask').forEach(button => {
    button.addEventListener('click', async () => {
      const taskId = parseInt(button.getAttribute('data-task-id'));
      await deleteTask(taskId);
    });
  });
}

function openTaskForm(task = null) {
  const modal = document.getElementById('taskModal');
  const form = document.getElementById('taskForm');
  const title = document.getElementById('taskTitle');
  const startDate = document.getElementById('taskStartDate');
  const dueDate = document.getElementById('taskDueDate');
  const description = document.getElementById('taskDescription');
  const status = document.getElementById('taskStatus');
  const tagsContainer = document.getElementById('tags');
  const submitButton = document.querySelector('.submit-button');

  form.reset();
  tagsContainer.innerHTML = '';

  if (task) {
    title.value = task.title;
    startDate.value = task.startDate || '';
    dueDate.value = task.dueDate || '';
    description.value = task.description || '';
    status.value = task.status || 'Pendiente';
    task.tags.forEach(tag => createTagElement(tag));
    submitButton.textContent = 'Actualizar tarea';
  } else {
    submitButton.textContent = 'Agregar tarea';
  }

  modal.style.display = 'block';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTask = {
      title: title.value,
      startDate: startDate.value || null,
      dueDate: dueDate.value || null,
      description: description.value,
      status: status.value || 'Pendiente',
      tags: Array.from(tagsContainer.querySelectorAll('.tag')).map(tag => tag.textContent.replace('x', '').trim())
    };

    if (task) {
      await TaskManager.editTask(task.id, newTask);
    } else {
      await TaskManager.addTask(newTask);
    }

    closeTaskForm();
    await renderTasks();
  });

  document.getElementById('tagInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagValue = e.target.value.trim();
      if (tagValue) {
        createTagElement(tagValue);
        e.target.value = '';
      }
    }
  });
}

function createTagElement(tag) {
  const tagElement = document.createElement('span');
  tagElement.classList.add('tag');
  tagElement.textContent = tag;

  const removeButton = document.createElement('button');
  removeButton.textContent = 'x';
  removeButton.classList.add('remove-tag');
  removeButton.addEventListener('click', () => {
    tagElement.remove();
  });

  tagElement.appendChild(removeButton);
  document.getElementById('tags').appendChild(tagElement);
}

function closeTaskForm() {
  const modal = document.getElementById('taskModal');
  modal.style.display = 'none';
}

async function deleteTask(taskId) {
  await TaskManager.deleteTask(taskId);
  await renderTasks();
}

// Funciones de "drag and drop"
function handleDragStart(e) {
  draggedTaskId = e.target.getAttribute('data-task-id');
  e.target.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
}

async function handleDrop(e) {
  e.preventDefault();
  const targetTaskId = e.target.closest('.task').getAttribute('data-task-id');

  if (draggedTaskId !== targetTaskId) {
    const tasks = await TaskManager.getTasks();
    const draggedTaskIndex = tasks.findIndex(task => task.id === parseInt(draggedTaskId));
    const targetTaskIndex = tasks.findIndex(task => task.id === parseInt(targetTaskId));

    const [draggedTask] = tasks.splice(draggedTaskIndex, 1);
    tasks.splice(targetTaskIndex, 0, draggedTask);

    await TaskManager.updateTasksOrder(tasks);
    renderTasks();
  }

  document.querySelector('.dragging')?.classList.remove('dragging');
}
