from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from pydantic import BaseModel

from app.config import get_db
from app.models.models import Course as CourseModel

router = APIRouter()

class CourseBase(BaseModel):
    name: str
    code: str
    credits: float
    hours: int

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int

    class Config:
        orm_mode = True

@router.get("/", response_model=List[Course])
def get_courses(db: Session = Depends(get_db)):
    """获取所有课程列表"""
    print("开始获取课程列表...")  # 添加调试日志
    try:
        print("正在查询数据库...")  # 添加调试日志
        courses = db.query(CourseModel).all()
        print(f"查询到的课程: {courses}")  # 添加调试日志
        if not courses:
            print("没有找到任何课程")  # 添加调试日志
            return []
        return courses
    except Exception as e:
        print(f"获取课程列表时出错: {str(e)}")  # 添加错误日志
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Course)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """创建新课程"""
    db_course = CourseModel(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/{course_id}", response_model=Course)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """获取指定课程信息"""
    course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    return course

@router.put("/{course_id}", response_model=Course)
def update_course(course_id: int, course: CourseCreate, db: Session = Depends(get_db)):
    """更新课程信息"""
    db_course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    for key, value in course.dict().items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """删除课程"""
    course = db.query(CourseModel).filter(CourseModel.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    
    db.delete(course)
    db.commit()
    return {"message": "课程已删除"}

@router.post("/import")
async def import_courses(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """从CSV文件导入课程数据"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="只支持CSV文件")
    
    content = await file.read()
    csv_data = content.decode('utf-8-sig')
    csv_reader = csv.DictReader(io.StringIO(csv_data))
    
    courses = []
    for row in csv_reader:
        course = CourseModel(
            name=row['name'],
            code=row['code'],
            credits=float(row['credits']),
            hours=int(row['hours'])
        )
        courses.append(course)
    
    try:
        db.add_all(courses)
        db.commit()
        return {"message": f"成功导入 {len(courses)} 条课程数据"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e)) 