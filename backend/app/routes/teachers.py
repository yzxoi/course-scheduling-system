from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from pydantic import BaseModel

from app.config import get_db
from app.models.models import Teacher as TeacherModel

router = APIRouter()

class TeacherBase(BaseModel):
    name: str
    title: str
    department: str

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: int

    class Config:
        orm_mode = True

@router.get("/", response_model=List[Teacher])
def get_teachers(db: Session = Depends(get_db)):
    """获取所有教师列表"""
    return db.query(TeacherModel).all()

@router.post("/", response_model=Teacher)
def create_teacher(teacher: TeacherCreate, db: Session = Depends(get_db)):
    """创建新教师"""
    db_teacher = TeacherModel(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.get("/{teacher_id}", response_model=Teacher)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """获取指定教师信息"""
    teacher = db.query(TeacherModel).filter(TeacherModel.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="教师不存在")
    return teacher

@router.put("/{teacher_id}", response_model=Teacher)
def update_teacher(teacher_id: int, teacher: TeacherCreate, db: Session = Depends(get_db)):
    """更新教师信息"""
    db_teacher = db.query(TeacherModel).filter(TeacherModel.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="教师不存在")
    
    for key, value in teacher.dict().items():
        setattr(db_teacher, key, value)
    
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    """删除教师"""
    teacher = db.query(TeacherModel).filter(TeacherModel.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="教师不存在")
    
    db.delete(teacher)
    db.commit()
    return {"message": "教师已删除"}

@router.post("/import")
async def import_teachers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """从CSV文件导入教师数据"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="只支持CSV文件")
    
    content = await file.read()
    csv_data = content.decode('utf-8-sig')
    csv_reader = csv.DictReader(io.StringIO(csv_data))
    
    teachers = []
    for row in csv_reader:
        teacher = TeacherModel(
            name=row['name'],
            title=row.get('title', ''),
            department=row.get('department', '')
        )
        teachers.append(teacher)
    
    try:
        db.add_all(teachers)
        db.commit()
        return {"message": f"成功导入 {len(teachers)} 条教师数据"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 