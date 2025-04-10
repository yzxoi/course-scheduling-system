from typing import List, Dict, Tuple
from sqlalchemy.orm import Session
import random
from datetime import datetime

from app.models.models import Course, Teacher, Classroom, Schedule

def check_conflicts(
    db: Session,
    day_of_week: int,
    time_slot: int,
    classroom_id: int,
    course_id: int,
    exclude_schedule_id: int = None
) -> List[Dict]:
    """
    检查指定时间段是否存在冲突
    返回冲突列表，如果没有冲突则返回空列表
    """
    conflicts = []
    
    # 检查教室冲突
    classroom_conflict = db.query(Schedule).filter(
        Schedule.classroom_id == classroom_id,
        Schedule.day_of_week == day_of_week,
        Schedule.time_slot == time_slot,
        Schedule.id != exclude_schedule_id
    ).first()
    
    if classroom_conflict:
        conflicts.append({
            "type": "classroom_conflict",
            "message": f"教室在此时间段已被占用"
        })
    
    # 检查教师冲突
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        teacher_conflict = db.query(Schedule).join(Course).filter(
            Course.teacher_id == course.teacher_id,
            Schedule.day_of_week == day_of_week,
            Schedule.time_slot == time_slot,
            Schedule.id != exclude_schedule_id
        ).first()
        
        if teacher_conflict:
            conflicts.append({
                "type": "teacher_conflict",
                "message": f"教师在此时间段已有其他课程"
            })
    
    return conflicts

def find_available_slot(
    db: Session,
    course: Course,
    classroom: Classroom,
    day_of_week: int,
    time_slot: int,
    exclude_schedule_id: int = None
) -> Tuple[int, int]:
    """
    查找可用的时间段
    返回 (day_of_week, time_slot) 或 (None, None) 如果找不到可用时间段
    """
    # 检查当前时间段是否可用
    conflicts = check_conflicts(
        db, day_of_week, time_slot,
        classroom.id, course.id,
        exclude_schedule_id
    )
    
    if not conflicts:
        return day_of_week, time_slot
    
    # 尝试其他时间段
    for d in range(1, 6):  # 周一到周五
        for t in range(1, 7):  # 6节课
            if d == day_of_week and t == time_slot:
                continue
                
            conflicts = check_conflicts(
                db, d, t,
                classroom.id, course.id,
                exclude_schedule_id
            )
            
            if not conflicts:
                return d, t
    
    return None, None

def generate_schedule(
    courses: List[Course],
    teachers: List[Teacher],
    classrooms: List[Classroom]
) -> List[Dict]:
    """
    生成课表
    使用贪心算法，按照以下优先级：
    1. 教师每天最大课时数限制
    2. 教室容量要求
    3. 课程每周课时数要求
    """
    # 按课程每周课时数降序排序，优先安排课时多的课程
    courses = sorted(courses, key=lambda x: x.weekly_hours, reverse=True)
    
    # 初始化结果列表
    schedule = []
    
    # 记录每个教师每天的课时数
    teacher_daily_hours = {teacher.id: {day: 0 for day in range(1, 6)} for teacher in teachers}
    
    # 为每个课程安排时间
    for course in courses:
        # 获取课程教师
        teacher = next(t for t in teachers if t.id == course.teacher_id)
        
        # 获取合适的教室（容量大于等于学生数）
        suitable_classrooms = [
            c for c in classrooms
            if c.capacity >= course.student_count
        ]
        
        if not suitable_classrooms:
            continue
        
        # 随机打乱教室顺序，避免总是使用同一个教室
        random.shuffle(suitable_classrooms)
        
        # 安排课程
        remaining_hours = course.weekly_hours
        while remaining_hours > 0:
            # 找到教师课时数最少的天
            min_hours_day = min(
                range(1, 6),
                key=lambda d: teacher_daily_hours[teacher.id][d]
            )
            
            # 如果教师当天课时数已达到上限，跳过
            if teacher_daily_hours[teacher.id][min_hours_day] >= teacher.max_hours_per_day:
                continue
            
            # 尝试每个合适的教室
            for classroom in suitable_classrooms:
                # 找到可用的时间段
                day, time_slot = find_available_slot(
                    None,  # 这里不需要db session，因为是新生成课表
                    course,
                    classroom,
                    min_hours_day,
                    1  # 从第一节课开始尝试
                )
                
                if day and time_slot:
                    # 添加到课表
                    schedule.append({
                        "course_id": course.id,
                        "classroom_id": classroom.id,
                        "day_of_week": day,
                        "time_slot": time_slot,
                        "semester": datetime.now().strftime('%Y-%m')
                    })
                    
                    # 更新教师课时数
                    teacher_daily_hours[teacher.id][day] += 1
                    remaining_hours -= 1
                    break
            
            # 如果无法安排更多课时，跳出循环
            if remaining_hours == course.weekly_hours:
                break
    
    return schedule 