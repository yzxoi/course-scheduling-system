from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class ClassroomBase(BaseModel):
    """教室基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="教室名称")
    capacity: int = Field(..., gt=0, description="教室容量")
    building: str = Field(..., min_length=1, max_length=50, description="所在建筑")

class ClassroomCreate(ClassroomBase):
    """创建教室模型"""
    pass

class ClassroomUpdate(ClassroomBase):
    """更新教室模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="教室名称")
    capacity: Optional[int] = Field(None, gt=0, description="教室容量")
    building: Optional[str] = Field(None, min_length=1, max_length=50, description="所在建筑")

class ClassroomResponse(ClassroomBase):
    """教室响应模型"""
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ClassroomImportResponse(BaseModel):
    """教室导入响应模型"""
    message: str 