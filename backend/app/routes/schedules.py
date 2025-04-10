from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel

router = APIRouter()

class Schedule(BaseModel):
    id: int = None
    course_id: int
    teacher_id: int
    classroom_id: int
    day: int  # 1-7 表示周一到周日
    period: int  # 1-12 表示第1-12节课

# 模拟数据库
schedules_db = []

@router.get("/", response_model=List[Schedule])
async def get_schedules():
    return schedules_db

@router.post("/", response_model=Schedule)
async def create_schedule(schedule: Schedule):
    # 检查时间冲突
    for s in schedules_db:
        if (s.day == schedule.day and 
            s.period == schedule.period and 
            s.classroom_id == schedule.classroom_id):
            raise HTTPException(
                status_code=400,
                detail="该时间段该教室已被占用"
            )
    
    schedule.id = len(schedules_db) + 1
    schedules_db.append(schedule)
    return schedule

@router.get("/{schedule_id}", response_model=Schedule)
async def get_schedule(schedule_id: int):
    for schedule in schedules_db:
        if schedule.id == schedule_id:
            return schedule
    raise HTTPException(status_code=404, detail="Schedule not found")

@router.put("/{schedule_id}", response_model=Schedule)
async def update_schedule(schedule_id: int, schedule: Schedule):
    # 检查时间冲突
    for s in schedules_db:
        if (s.id != schedule_id and
            s.day == schedule.day and 
            s.period == schedule.period and 
            s.classroom_id == schedule.classroom_id):
            raise HTTPException(
                status_code=400,
                detail="该时间段该教室已被占用"
            )
    
    for i, s in enumerate(schedules_db):
        if s.id == schedule_id:
            schedule.id = schedule_id
            schedules_db[i] = schedule
            return schedule
    raise HTTPException(status_code=404, detail="Schedule not found")

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int):
    for i, schedule in enumerate(schedules_db):
        if schedule.id == schedule_id:
            return schedules_db.pop(i)
    raise HTTPException(status_code=404, detail="Schedule not found") 