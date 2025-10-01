import os
from dotenv import load_dotenv
from sqlmodel import create_engine, SQLModel

# Cargar variables de entorno desde .env
load_dotenv()

# Obtenemos la URL de conexión completa de PostgreSQL desde el .env
database_url = os.environ.get("SQLMODEL_DATABASE_URL")

# Creación del Motor (Engine)
engine = create_engine(database_url, echo=True)

# --- Funciones de Ciclo de Vida ---
def create_all_tables():
    """
    Función que crea todas las tablas definidas por los modelos SQLModel
    en la base de datos.
    """
    print("Creando todas las tablas en la base de datos RDS...")

    SQLModel.metadata.create_all(engine)
    print("Tablas creadas exitosamente.")