document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements --- 
    const newTodoInput = document.getElementById('new-todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');

    // --- Data Storage ---
    // Array to hold todo objects: { id: uniqueNumber, text: 'Task description', completed: boolean }
    let todos = []; 

    // --- Helper Functions ---

    /**
     * Saves the current 'todos' array to localStorage.
     */
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    /**
     * Loads todos from localStorage and initializes the 'todos' array.
     * This function is called once when the app starts.
     */
    function loadTodos() {
        const storedTodos = localStorage.getItem('todos');
        if (storedTodos) {
            todos = JSON.parse(storedTodos);
        }
    }

    /**
     * Renders all todos from the 'todos' array to the DOM.
     * It clears the current list and recreates all items.
     */
    function renderTodos() {
        todoList.innerHTML = ''; // Clear existing list items to re-render

        // Display an empty state message if there are no todos
        if (todos.length === 0) {
            const emptyState = document.createElement('li');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No tasks yet! Add one above.';
            todoList.appendChild(emptyState);
            return;
        }

        // Iterate over the todos array and create DOM elements for each
        todos.forEach(todo => {
            const listItem = document.createElement('li');
            // Add 'completed' class if the todo is done for styling
            listItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            // Store the todo's ID as a data attribute for easy reference in event handling
            listItem.setAttribute('data-id', todo.id);

            listItem.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''} data-action="toggle">
                <span>${todo.text}</span>
                <button class="delete-btn" data-action="delete">✕</button>
            `;
            // Using a simple unicode '✕' for the delete icon. For more complex apps,
            // an SVG icon or an icon font (e.g., FontAwesome) might be preferred.

            todoList.appendChild(listItem);
        });
    }

    /**
     * Adds a new todo item to the list.
     * @param {string} text - The text content of the new todo.
     */
    function addTodo(text) {
        const trimmedText = text.trim();
        if (trimmedText === '') {
            alert('Todo cannot be empty!');
            return;
        }

        const newTodo = {
            id: Date.now(), // Generate a unique ID using the current timestamp
            text: trimmedText,
            completed: false
        };

        todos.unshift(newTodo); // Add new todo to the beginning of the array
        saveTodos();
        renderTodos();
        newTodoInput.value = ''; // Clear the input field after adding
    }

    /**
     * Toggles the 'completed' status of a todo item.
     * @param {number} id - The unique ID of the todo item to toggle.
     */
    function toggleComplete(id) {
        todos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        saveTodos();
        renderTodos();
    }

    /**
     * Deletes a todo item from the list.
     * @param {number} id - The unique ID of the todo item to delete.
     */
    function deleteTodo(id) {
        // Filter out the todo item with the matching ID
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    }

    // --- Event Listeners ---

    // Event listener for the 'Add Todo' button click
    addTodoBtn.addEventListener('click', () => {
        addTodo(newTodoInput.value);
    });

    // Event listener for 'Enter' key press in the input field
    newTodoInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTodo(newTodoInput.value);
        }
    });

    // Using event delegation on the todo list to handle clicks on checkboxes and delete buttons.
    // This is more efficient than attaching listeners to each individual todo item.
    todoList.addEventListener('click', (event) => {
        const target = event.target;
        // Find the closest 'todo-item' parent to identify which todo was clicked
        const listItem = target.closest('.todo-item');

        // If the click wasn't on a todo item, do nothing
        if (!listItem) return;

        // Get the todo's ID from its data attribute
        const todoId = parseInt(listItem.getAttribute('data-id'));

        // Check which action was triggered (toggle checkbox or delete button)
        if (target.dataset.action === 'toggle') {
            toggleComplete(todoId);
        } else if (target.dataset.action === 'delete') {
            deleteTodo(todoId);
        }
    });

    // --- Initialization ---
    // Load todos from localStorage and render them when the page first loads
    loadTodos();
    renderTodos();
});
