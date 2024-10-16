class TaskManager {
  static async getTasks() {
    return new Promise((resolve) => {
      chrome.storage.local.get('tasks', (data) => {
        resolve(data.tasks || []);
      });
    });
  }

  static async saveTasks(tasks) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ tasks }, () => {
        resolve();
      });
    });
  }

  static async addTask(task) {
    const tasks = await this.getTasks();
    tasks.push({
      ...task,
      id: new Date().getTime(),
      status: task.status || 'Pendiente'
    });
    await this.saveTasks(tasks);
  }

  static async editTask(taskId, updatedTask) {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
      await this.saveTasks(tasks);
    }
  }

  static async deleteTask(taskId) {
    const tasks = await this.getTasks();
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    await this.saveTasks(updatedTasks);
  }

  static async generateWeeklyReport() {
    const tasks = await this.getTasks();
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const csvContent = [
      ['Fecha de Creación', 'Título', 'Descripción', 'Estado', 'Fecha de Vencimiento', 'Etiquetas'],
      ...tasks.map(task => [
        new Date(task.id).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
        task.title,
        task.description || 'Sin descripción',
        task.status || 'Sin estado',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha',
        task.tags ? task.tags.join(', ') : 'Sin etiquetas'
      ])
    ].map(row => row.join(',')).join('\n');

    return csvContent;
  }

  static async downloadCSV(content, fileName) {
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async updateTasksOrder(updatedTasks) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ tasks: updatedTasks }, () => {
        resolve();
      });
    });
  }
}
