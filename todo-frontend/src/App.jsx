import React, { useState, useEffect, useCallback } from 'react';

// URL base de tu API de FastAPI (Asegúrate que el puerto sea el correcto)
const API_URL = 'http://localhost:8000/tasks/'; 

// ----------------------------------------------------------------------
// 1. COMPONENTE: TaskForm (Integrado dentro de App)
// ----------------------------------------------------------------------
function TaskForm({ onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('El título es obligatorio.'); 
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const newTask = { title, description };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Notificar al componente padre para que refresque la lista
      onTaskCreated(); 
      
      // Limpiar el formulario
      setTitle('');
      setDescription('');

    } catch (e) {
      console.error('Error creating task:', e);
      setError('Error al crear la tarea. Revisa la conexión a la API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border border-blue-200 rounded-xl shadow-lg bg-white mb-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">Crear Nueva Tarea</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="p-2 bg-red-100 text-red-700 rounded font-medium">{error}</p>}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título (*)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-inner p-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción (Opcional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-inner p-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 transition duration-150 transform hover:scale-[1.01]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Guardando en RDS...' : 'Guardar Tarea'}
        </button>
      </form>
    </div>
  );
}


// ----------------------------------------------------------------------
// 2. COMPONENTE PRINCIPAL: App
// ----------------------------------------------------------------------
function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Definimos fetchTasks con useCallback para optimización
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (e) {
      console.error("Error fetching tasks:", e);
      setError("❌ Error de conexión: No se pudo conectar con la API de FastAPI.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);


  // ----------------------------------------------------------------------
  // MANEJADORES DE ACCIONES (DELETE y PUT)
  // ----------------------------------------------------------------------

  // Lógica para actualizar el estado (marcar como completada)
  const handleToggleCompleted = async (task) => {
    const newCompletedState = !task.completed; // Invertir el estado

    const updatePayload = {
      completed: newCompletedState,
    };

    try {
      const response = await fetch(`${API_URL}${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error(`Fallo al actualizar el estado: ${response.status}`);
      }

      // Refrescar la lista de tareas para ver el cambio
      fetchTasks(); 

    } catch (e) {
      console.error("Error toggling task completion:", e);
      // alert('Error al cambiar el estado de la tarea.'); // Usar una notificación real
    }
  };


  // Lógica para eliminar una tarea
  const handleDeleteTask = async (id) => {
    // Usamos una confirmación simple (lo ideal sería un modal)
    if (!window.confirm(`¿Estás seguro de eliminar la tarea con ID ${id}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // El DELETE en FastAPI devuelve un JSON simple, no hay problema si no tiene contenido
        throw new Error(`Fallo al eliminar: ${response.status}`);
      }

      // Refrescar la lista de tareas
      fetchTasks(); 

    } catch (e) {
      console.error("Error deleting task:", e);
      // alert('Error al eliminar la tarea.');
    }
  };

  // ----------------------------------------------------------------------
  // RENDERIZADO
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-800">
          📋 ToDo App React & FastAPI
        </h1>
        
        {/* Componente de Creación de Tareas */}
        <TaskForm onTaskCreated={fetchTasks} /> 

        <div className="mt-10">
          <h2 className="text-3xl font-bold mb-4 text-gray-700">Tareas Pendientes y Completadas</h2>
          
          {/* Mensajes de Estado */}
          {loading && (
            <div className="text-center p-4 bg-yellow-100 rounded-lg text-yellow-700 font-semibold">
              Cargando tareas de RDS...
            </div>
          )}
          {error && (
            <div className="text-center p-4 bg-red-100 rounded-lg text-red-700 font-bold">
              {error}
            </div>
          )}
          
          {/* Mostrar Tareas */}
          {!loading && !error && (
            <ul className="space-y-4">
              {tasks.map(task => (
                <li 
                  key={task.id} 
                  className={`p-4 border rounded-xl shadow-md flex justify-between items-center transition duration-200 
                    ${task.completed ? 'bg-green-100 border-green-300' : 'bg-white hover:shadow-lg'}`}
                >
                  {/* Contenido de la Tarea */}
                  <div className="flex-1 mr-4">
                    <h3 className={`text-xl font-semibold ${task.completed ? 'line-through text-green-700' : 'text-gray-800'}`}>
                      {task.title}
                    </h3>
                    <p className={`text-sm mt-1 ${task.completed ? 'text-green-600' : 'text-gray-500'}`}>
                      {task.description || 'Sin descripción'}
                    </p>
                    <p className="text-xs mt-1 text-gray-400">ID: {task.id}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 items-center">
                    {/* Botón de Completado */}
                    <button
                      onClick={() => handleToggleCompleted(task)}
                      className={`p-3 rounded-full text-white shadow-md transition duration-150 transform hover:scale-105
                        ${task.completed ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                      title={task.completed ? 'Marcar como Pendiente' : 'Marcar como Completada'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        {task.completed ? 
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          :
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        }
                      </svg>
                    </button>

                    {/* Botón de Eliminar */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition duration-150 transform hover:scale-105"
                      title="Eliminar Tarea"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
              {tasks.length === 0 && <p className="text-center p-4 text-gray-500">🎉 ¡Felicidades! No hay tareas pendientes.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
