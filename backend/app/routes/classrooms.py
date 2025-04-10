from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
import csv
import io
from pydantic import BaseModel

from app.config import get_db
from app.models.models import Classroom as ClassroomModel
from app.models.schemas import ClassroomCreate, ClassroomUpdate, ClassroomResponse, ClassroomImportResponse

router = APIRouter()

class ClassroomBase(BaseModel):
    name: str
    capacity: int
    building: str

class ClassroomCreate(ClassroomBase):
    pass

class Classroom(ClassroomBase):
    id: int

    class Config:
        orm_mode = True

@router.get("/", response_model=List[Classroom])
def get_classrooms(db: Session = Depends(get_db)):
    """获取所有教室列表"""
    return db.query(ClassroomModel).all()

@router.post("/", response_model=Classroom)
def create_classroom(classroom: ClassroomCreate, db: Session = Depends(get_db)):
    """创建新教室"""
    db_classroom = ClassroomModel(**classroom.dict())
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@router.get("/{classroom_id}", response_model=Classroom)
def get_classroom(classroom_id: int, db: Session = Depends(get_db)):
    """获取指定教室信息"""
    classroom = db.query(ClassroomModel).filter(ClassroomModel.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="教室不存在")
    return classroom

@router.put("/{classroom_id}", response_model=Classroom)
def update_classroom(classroom_id: int, classroom: ClassroomCreate, db: Session = Depends(get_db)):
    """更新教室信息"""
    db_classroom = db.query(ClassroomModel).filter(ClassroomModel.id == classroom_id).first()
    if not db_classroom:
        raise HTTPException(status_code=404, detail="教室不存在")
    
    for key, value in classroom.dict().items():
        setattr(db_classroom, key, value)
    
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@router.delete("/{classroom_id}")
def delete_classroom(classroom_id: int, db: Session = Depends(get_db)):
    """删除教室"""
    classroom = db.query(ClassroomModel).filter(ClassroomModel.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="教室不存在")
    
    db.delete(classroom)
    db.commit()
    return {"message": "教室已删除"}

@router.post("/import", response_model=ClassroomImportResponse)
async def import_classrooms(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """从CSV文件导入教室数据"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持CSV文件"
        )
    
    try:
        content = await file.read()
        csv_data = content.decode('utf-8-sig')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        # 验证CSV文件格式
        required_fields = ['name', 'capacity', 'building']
        for field in required_fields:
            if field not in csv_reader.fieldnames:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CSV文件缺少必要字段: {field}"
                )
        
        classrooms = []
        for row in csv_reader:
            try:
                # 验证数据
                if not row['name'] or len(row['name']) > 50:
                    raise ValueError(f"教室名称无效: {row['name']}")
                
                capacity = int(row.get('capacity', 50))
                if capacity <= 0:
                    raise ValueError(f"教室容量必须大于0: {capacity}")
                
                if not row.get('building') or len(row.get('building', '')) > 50:
                    raise ValueError(f"建筑名称无效: {row.get('building', '')}")
                
                classroom = ClassroomModel(
                    name=row['name'],
                    capacity=capacity,
                    building=row.get('building', '')
                )
                classrooms.append(classroom)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CSV数据验证失败: {str(e)}"
                )
        
        # 检查教室名称是否重复
        classroom_names = [c.name for c in classrooms]
        if len(classroom_names) != len(set(classroom_names)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV文件中存在重复的教室名称"
            )
        
        # 检查教室名称是否已存在于数据库
        existing_names = [c.name for c in db.query(ClassroomModel).filter(ClassroomModel.name.in_(classroom_names)).all()]
        if existing_names:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"以下教室名称已存在: {', '.join(existing_names)}"
            )
        
        db.add_all(classrooms)
        db.commit()
        return {"message": f"成功导入 {len(classrooms)} 条教室数据"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/stats/usage", response_model=Dict[str, Any])
def get_classroom_usage_stats(db: Session = Depends(get_db)):
    """获取教室使用情况统计"""
    try:
        # 获取所有教室
        classrooms = db.query(ClassroomModel).all()
        
        # 获取每个教室的课程安排数量
        schedule_counts = db.query(
            Schedule.classroom_id,
            func.count(Schedule.id).label('schedule_count')
        ).group_by(Schedule.classroom_id).all()
        
        # 将课程安排数量转换为字典
        schedule_count_dict = {item.classroom_id: item.schedule_count for item in schedule_counts}
        
        # 计算总课程安排数量
        total_schedules = sum(schedule_count_dict.values())
        
        # 计算教室使用率
        classroom_count = len(classrooms)
        usage_stats = {
            "total_classrooms": classroom_count,
            "total_schedules": total_schedules,
            "average_schedules_per_classroom": total_schedules / classroom_count if classroom_count > 0 else 0,
            "classroom_details": []
        }
        
        # 添加每个教室的详细信息
        for classroom in classrooms:
            schedule_count = schedule_count_dict.get(classroom.id, 0)
            usage_percentage = (schedule_count / total_schedules * 100) if total_schedules > 0 else 0
            
            classroom_details = {
                "id": classroom.id,
                "name": classroom.name,
                "capacity": classroom.capacity,
                "building": classroom.building,
                "schedule_count": schedule_count,
                "usage_percentage": round(usage_percentage, 2)
            }
            usage_stats["classroom_details"].append(classroom_details)
        
        # 按使用率排序
        usage_stats["classroom_details"].sort(key=lambda x: x["schedule_count"], reverse=True)
        
        return usage_stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取教室使用情况统计失败: {str(e)}"
        )

@router.get("/stats/capacity", response_model=Dict[str, Any])
def get_classroom_capacity_stats(db: Session = Depends(get_db)):
    """获取教室容量统计"""
    try:
        # 获取所有教室
        classrooms = db.query(ClassroomModel).all()
        
        # 计算总容量
        total_capacity = sum(classroom.capacity for classroom in classrooms)
        
        # 计算平均容量
        average_capacity = total_capacity / len(classrooms) if classrooms else 0
        
        # 按容量分组统计
        capacity_groups = {
            "0-50": 0,
            "51-100": 0,
            "101-200": 0,
            "201-500": 0,
            "500+": 0
        }
        
        for classroom in classrooms:
            if classroom.capacity <= 50:
                capacity_groups["0-50"] += 1
            elif classroom.capacity <= 100:
                capacity_groups["51-100"] += 1
            elif classroom.capacity <= 200:
                capacity_groups["101-200"] += 1
            elif classroom.capacity <= 500:
                capacity_groups["201-500"] += 1
            else:
                capacity_groups["500+"] += 1
        
        capacity_stats = {
            "total_classrooms": len(classrooms),
            "total_capacity": total_capacity,
            "average_capacity": round(average_capacity, 2),
            "capacity_groups": capacity_groups
        }
        
        return capacity_stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取教室容量统计失败: {str(e)}"
        ) 