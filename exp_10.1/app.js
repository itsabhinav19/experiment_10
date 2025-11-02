const API_URL = "http://localhost:5000/api/todos";
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");

// Fetch all todos
async function loadTodos() {
  const res = await fetch(API_URL);
  const todos = await res.json();
  renderTodos(todos);
}

// Add new todo
todoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = todoInput.value.trim();
  if (!title) return;
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  todoInput.value = "";
  loadTodos();
});

// Update (mark done)
async function toggleTodo(id, completed) {
  await fetch(${API_URL}/${id}, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  loadTodos();
}

// Delete todo
async function deleteTodo(id) {
  await fetch(${API_URL}/${id}, { method: "DELETE" });
  loadTodos();
}

// Render todos
function renderTodos(todos) {
  todoList.innerHTML = todos
    .map(
      (t) => `
      <li>
        <span class="${t.completed ? "done" : ""}" 
              onclick="toggleTodo('${t.id}', ${!t.completed})">${t.title}</span>
        <div class="actions">
          <button onclick="deleteTodo('${t.id}')">🗑</button>
        </div>
      </li>`
    )
    .join("");
}

// Make functions global
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;

loadTodos();