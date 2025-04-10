from sqlalchemy.orm import Session
from app.models.models import Teacher, Course, Classroom, Schedule
from app.config import SessionLocal

def seed_data():
    db = SessionLocal()
    try:
        # 清空现有数据
        db.query(Schedule).delete()
        db.query(Teacher).delete()
        db.query(Course).delete()
        db.query(Classroom).delete()
        db.commit()
        
        # 添加教师数据
        teachers = [
            Teacher(name="张三", title="教授", department="计算机科学系"),
            Teacher(name="李四", title="副教授", department="数学系"),
            Teacher(name="王五", title="讲师", department="物理系")
        ]
        db.add_all(teachers)
        db.commit()
        db.refresh(teachers[0])
        db.refresh(teachers[1])
        db.refresh(teachers[2])
        
        # 添加课程数据
        courses = [
            Course(name="高等数学", code="MATH101", credits=4.0, hours=64),
            Course(name="大学物理", code="PHYS101", credits=3.0, hours=48),
            Course(name="程序设计基础", code="CS101", credits=3.0, hours=48)
        ]
        db.add_all(courses)
        db.commit()
        db.refresh(courses[0])
        db.refresh(courses[1])
        db.refresh(courses[2])
        
        # 添加教室数据
        classrooms = [
            Classroom(name="A101", capacity=50, building="A楼"),
            Classroom(name="B201", capacity=100, building="B楼"),
            Classroom(name="C301", capacity=30, building="C楼")
        ]
        db.add_all(classrooms)
        db.commit()
        db.refresh(classrooms[0])
        db.refresh(classrooms[1])
        db.refresh(classrooms[2])
        
        # 添加课表数据
        schedules = [
            Schedule(course_id=courses[0].id, teacher_id=teachers[1].id, classroom_id=classrooms[0].id, day=1, period=1),  # 周一第1节 高等数学
            Schedule(course_id=courses[1].id, teacher_id=teachers[2].id, classroom_id=classrooms[1].id, day=1, period=3),  # 周一第3节 大学物理
            Schedule(course_id=courses[2].id, teacher_id=teachers[0].id, classroom_id=classrooms[2].id, day=2, period=2),  # 周二第2节 程序设计基础
            Schedule(course_id=courses[0].id, teacher_id=teachers[1].id, classroom_id=classrooms[0].id, day=3, period=4),  # 周三第4节 高等数学
            Schedule(course_id=courses[1].id, teacher_id=teachers[2].id, classroom_id=classrooms[1].id, day=4, period=1),  # 周四第1节 大学物理
            Schedule(course_id=courses[2].id, teacher_id=teachers[0].id, classroom_id=classrooms[2].id, day=5, period=3)   # 周五第3节 程序设计基础
        ]
        db.add_all(schedules)
        db.commit()
        
        print("测试数据添加成功！")
        
    except Exception as e:
        print(f"添加测试数据时出错: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data() 