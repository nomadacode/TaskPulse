// newtab/newtab.js - Código para manejar agregar, editar y eliminar tareas en la nueva pestaña

document.addEventListener('DOMContentLoaded', async () => {
  await renderTasks();

  document.getElementById('addTask').addEventListener('click', () => {
    if (!document.getElementById('taskModal')) {
      showTaskForm();
    }
  });
});

async function renderTasks() {
  const tasks = await TaskManager.getTasks();
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = tasks.map(task => `
    <div class="task">
      <span>${task.title} (Due: ${task.dueDate})</span>
      <button class="editTask" data-task-id="${task.id}">Edit</button>
      <button class="deleteTask" data-task-id="${task.id}">Delete</button>
    </div>
  `).join('');

  document.querySelectorAll('.editTask').forEach(button => {
    button.addEventListener('click', async () => {
      const taskId = parseInt(button.getAttribute('data-task-id'));
      if (!document.getElementById('taskModal')) {
        const task = await TaskManager.getTasks().then(tasks => tasks.find(t => t.id === taskId));
        showTaskForm(task);
      }
    });
  });

  document.querySelectorAll('.deleteTask').forEach(button => {
    button.addEventListener('click', async () => {
      const taskId = parseInt(button.getAttribute('data-task-id'));
      await deleteTask(taskId);
    });
  });
}

function showTaskForm(task = null) {
  closeTaskForm(); // Cerrar cualquier modal abierto antes de mostrar uno nuevo
  const modal = document.createElement('div');
  modal.id = 'taskModal';
  modal.classList.add('modal');
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-button" id="closeModal">&times;</span>
      <h2>${task ? 'Editar tarea' : 'Agregar tarea'}</h2>
      <form id="taskForm">
        <input type="text" id="taskTitle" placeholder="Título de la tarea" value="${task ? task.title : ''}" required />
        <input type="date" id="taskDueDate" value="${task ? task.dueDate : ''}" required />
        <textarea id="taskDescription" placeholder="Descripción de la tarea" rows="6">${task ? task.description : ''}</textarea>
        <button type="submit" class="submit-button">${task ? 'Actualizar' : 'Agregar'} tarea</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'block';

  document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const description = document.getElementById('taskDescription').value;

    if (task) {
      await TaskManager.editTask(task.id, { title, dueDate, description });
    } else {
      await TaskManager.addTask({ title, dueDate, description });
    }

    closeTaskForm();
    await renderTasks();
  });

  document.getElementById('closeModal').addEventListener('click', closeTaskForm);
}

function closeTaskForm() {
  const modal = document.getElementById('taskModal');
  if (modal) {
    modal.remove();
  }
}

async function deleteTask(taskId) {
  await TaskManager.deleteTask(taskId);
  await renderTasks();
}