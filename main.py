from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Field, SQLModel, Session, select
from database import engine, create_all_tables

# Se define los campos
class TaskBase(SQLModel):
    title: str = Field(index=True)
    description: Optional[str] = None
    completed: bool = Field(default=False)

# Modelo de Tabla
class Task(TaskBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class TaskRead(TaskBase):
    id: int

class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

# --- Configuración de FastAPI ---
# main.py (Añade estas importaciones arriba si no están)
from fastapi.middleware.cors import CORSMiddleware 
# ...

# --- Configuración de FastAPI ---
app = FastAPI()

# Añadir el Middleware de CORS
origins = [
    "http://localhost:3000",  # El puerto por defecto de React
    "http://127.0.0.1:3000",
    "*"  # Para desarrollo rápido
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Permitir cookies (opcional, pero buena práctica)
    allow_methods=["*"],    # Permitir todos los métodos (GET, POST, PUT, DELETE)
    allow_headers=["*"],    # Permitir todos los encabezados
)
#-------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    create_all_tables()

@app.get("/")
def read_root():
    return {"Bienivenido a mi primer examen"}

# Esta función inyecta la sesión de DB en los endpoints
def get_session():
    with Session(engine) as session:
        yield session

# --- Endpoints ---

@app.post("/tasks/", response_model=TaskRead)
def create_task(task: TaskBase, session: Session = Depends(get_session)):
    """Crear una nueva tarea en RDS."""
    db_task = Task.model_validate(task)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=List[TaskRead])
def read_tasks(session: Session = Depends(get_session)):
    """Listar todas las tareas en la base de datos."""
    
    # Construimos la consulta: SELECT * FROM task
    statement = select(Task)
    results = session.exec(statement).all()
    return results

# --- Consultar por ID ---

@app.get("/tasks/{task_id}", response_model=TaskRead)
def read_task_by_id(task_id: int, session: Session = Depends(get_session)):
    """Consultar una tarea específica por ID."""
    statement = select(Task).where(Task.id == task_id)
    task = session.exec(statement).one_or_none()

    # Manejo de error
    if task is None:
        raise HTTPException(status_code=404, detail=f"Tarea con ID {task_id} no encontrada.")
    return task

# --- Endpoint UPDATE POR ID  ---

@app.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int, 
    task: TaskUpdate, 
    session: Session = Depends(get_session)
):
    """Actualizar título, descripción o estado de una tarea."""
    
    # 1. Buscar la tarea existente
    db_task = session.get(Task, task_id)
    
    if not db_task:
        raise HTTPException(status_code=404, detail=f"Tarea con ID {task_id} no encontrada.")

    # 2. Fusión de datos convertimos TaskUpdate a un diccionario
    task_data = task.model_dump(exclude_unset=True) 
    db_task.model_validate(task_data, update=True)
    
    # 3. Registro y Commit
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    
    return db_task

# --- Endpoint DELETE  ---

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    """Eliminar una tarea por ID."""
    
    # 1. Buscar la tarea existente
    # Usamos session.get() que es más directo para buscar por ID
    db_task = session.get(Task, task_id)
    
    if not db_task:
        raise HTTPException(status_code=404, detail=f"Tarea con ID {task_id} no encontrada.")

    # 2. Eliminar y Commit
    session.delete(db_task)
    session.commit()
    return {"ok": True, "message": f"Tarea con ID {task_id} eliminada exitosamente."}
