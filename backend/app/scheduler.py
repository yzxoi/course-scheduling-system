from typing import List, Dict, Set
from datetime import datetime
from .models import Course, Teacher, Classroom, Schedule
from sqlalchemy.orm import Session

class Scheduler:
    def __init__(self, db: Session):
        self.db = db
        self.conflicts = []
        
    def generate_schedule(self) -> List[Dict]:
        """生成课表"""
        try:
            # 获取所有需要排课的课程
            courses = self.db.query(Course).all()
            # 获取所有可用教室
            classrooms = self.db.query(Classroom).all()
            # 获取所有教师
            teachers = self.db.query(Teacher).all()
            
            if not courses or not classrooms or not teachers:
                self.conflicts.append({
                    'message': '没有足够的课程、教室或教师数据'
                })
                return []
            
            # 按课程优先级排序（这里简单按照课程ID排序）
            courses.sort(key=lambda x: x.id)
            
            # 初始化课表
            schedule = []
            used_slots = set()  # 记录已使用的时间槽
            
            # 为每个课程分配时间槽和教室
            for course in courses:
                # 随机选择一个教师
                import random
                teacher = random.choice(teachers)
                
                # 找到合适的教室（容量足够且未被使用）
                suitable_classrooms = [
                    c for c in classrooms 
                    if c.capacity >= 50  # 临时使用固定容量
                ]
                
                if not suitable_classrooms:
                    self.conflicts.append({
                        'course_id': course.id,
                        'message': f'课程 {course.name} 没有合适的教室'
                    })
                    continue
                
                # 随机选择一个合适的教室
                classroom = random.choice(suitable_classrooms)
                
                # 找到可用的时间槽
                time_slot = self._find_available_slot(course, teacher, classroom, used_slots)
                if not time_slot:
                    self.conflicts.append({
                        'course_id': course.id,
                        'message': f'课程 {course.name} 无法找到合适的时间槽'
                    })
                    continue
                
                # 创建排课记录
                schedule_item = {
                    'course_id': course.id,
                    'course_name': course.name,
                    'teacher_id': teacher.id,
                    'teacher_name': teacher.name,
                    'classroom_id': classroom.id,
                    'classroom_name': classroom.name,
                    'day': time_slot['day'],
                    'period': time_slot['period'],
                    'has_conflict': False
                }
                
                # 保存到数据库
                new_schedule = Schedule(
                    course_id=course.id,
                    teacher_id=teacher.id,
                    classroom_id=classroom.id,
                    day=time_slot['day'],
                    period=time_slot['period']
                )
                self.db.add(new_schedule)
                
                schedule.append(schedule_item)
                used_slots.add((time_slot['day'], time_slot['period'], classroom.id))
            
            # 提交数据库事务
            self.db.commit()
            
            return schedule
            
        except Exception as e:
            # 发生错误时回滚事务
            self.db.rollback()
            self.conflicts.append({
                'message': f'自动排课失败: {str(e)}'
            })
            return []
        
    def _find_available_slot(self, course: Course, teacher: Teacher, 
                           classroom: Classroom, used_slots: Set) -> Dict:
        """查找可用的时间槽"""
        # 简单实现：遍历所有可能的时间槽
        for day in range(1, 6):  # 周一到周五
            for period in range(1, 9):  # 8节课
                slot = (day, period, classroom.id)
                if slot not in used_slots:
                    return {'day': day, 'period': period}
        return None
        
    def check_conflicts(self, schedule: List[Dict]) -> List[Dict]:
        """检查课表中的冲突"""
        conflicts = []
        
        # 检查时间冲突
        time_slots = {}
        for item in schedule:
            key = (item['day'], item['period'], item['classroom_id'])
            if key in time_slots:
                conflicts.append({
                    'type': 'time_conflict',
                    'message': f'教室 {item["classroom_name"]} 在周{item["day"]}第{item["period"]}节有冲突',
                    'items': [time_slots[key], item]
                })
            else:
                time_slots[key] = item
                
        # 检查教师冲突
        teacher_slots = {}
        for item in schedule:
            key = (item['day'], item['period'], item['teacher_id'])
            if key in teacher_slots:
                conflicts.append({
                    'type': 'teacher_conflict',
                    'message': f'教师 {item["teacher_name"]} 在周{item["day"]}第{item["period"]}节有冲突',
                    'items': [teacher_slots[key], item]
                })
            else:
                teacher_slots[key] = item
                
        return conflicts 