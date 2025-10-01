import React, { useState } from 'react';

const API_URL = 'http://localhost:8000/tasks/';

// Recibe onTaskCreated como prop para que App.jsx sepa que una tarea fue creada
function TaskForm({ onTaskCreated }) {
  // 1. Estados para los campos del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 2. Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evitar el comportamiento por defecto de recargar la página

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

      // 3. Notificar al componente padre que una tarea fue creada
      onTaskCreated(); 
      
      // 4. Limpiar el formulario
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
    <div className="p-4 border rounded shadow-lg bg-gray-50 mb-6">
      <h2 className="text-xl font-semibold mb-4">Crear Nueva Tarea</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 font-bold">{error}</p>}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título (*)</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 disabled:bg-blue-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creando...' : 'Guardar Tarea'}
        </button>
      </form>
    </div>
  );
}

export default TaskForm;