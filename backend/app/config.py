from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy_utils import database_exists, create_database
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv
from app.models.models import Base

# 加载环境变量
load_dotenv()

# 数据库配置
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456")
DB_NAME = os.getenv("DB_NAME", "course_scheduling")

print(f"数据库配置: HOST={DB_HOST}, PORT={DB_PORT}, USER={DB_USER}, DB={DB_NAME}")

# 创建数据库URL
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"数据库URL: {SQLALCHEMY_DATABASE_URL}")

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=5,
    max_overflow=10,
    echo=True  # 启用SQL语句日志
)

# 添加数据库引擎事件监听器
@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    print("数据库连接成功!")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    print("获取数据库连接!")

# 如果数据库不存在，则创建
if not database_exists(engine.url):
    print(f"数据库 {DB_NAME} 不存在，正在创建...")
    create_database(engine.url)
    print(f"数据库 {DB_NAME} 创建成功!")

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 创建所有表
def create_tables():
    """创建数据库表"""
    print("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)
    print("数据库表创建成功!")