from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
import os
from sqlalchemy.orm import Session

from app.routes.teachers import router as teachers_router
from app.routes.courses import router as courses_router
from app.routes.classrooms import router as classrooms_router
from app.routes.schedules import router as schedules_router
from app.config import create_tables, get_db
from app.scheduler import Scheduler
from app.models import Schedule

app = FastAPI(
    title="高校排课系统API",
    description="高校排课系统后端API服务",
    version="1.0.0",
    debug=True
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 获取项目根目录
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

# 创建数据库表
create_tables()

# 注册API路由
app.include_router(teachers_router, prefix="/api/teachers", tags=["teachers"])
app.include_router(courses_router, prefix="/api/courses", tags=["courses"])
app.include_router(classrooms_router, prefix="/api/classrooms", tags=["classrooms"])
app.include_router(schedules_router, prefix="/api/schedules", tags=["schedules"])

# API路由重定向
@app.get("/api/{path:path}", include_in_schema=False)
async def api_redirect(request: Request, path: str):
    """重定向不带斜杠的API请求到带斜杠的路径"""
    if not request.url.path.endswith("/"):
        return RedirectResponse(url=request.url.path + "/")

# 静态文件路由
@app.get("/", response_class=FileResponse)
async def read_root():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/{path:path}", response_class=FileResponse)
async def read_path(path: str):
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="File not found")

# 添加调度相关的API路由
@app.post("/api/schedule/generate")
async def generate_schedule(db: Session = Depends(get_db)):
    scheduler = Scheduler(db)
    schedule = scheduler.generate_schedule()
    conflicts = scheduler.check_conflicts(schedule)
    return {
        "success": True,
        "schedule": schedule,
        "conflicts": conflicts
    }

@app.post("/api/schedule/update")
async def update_schedule(schedule_item: dict, db: Session = Depends(get_db)):
    # 更新单个课程的时间安排
    try:
        # 检查是否存在冲突
        scheduler = Scheduler(db)
        conflicts = scheduler.check_conflicts([schedule_item])
        if conflicts:
            return {"success": False, "conflicts": conflicts}
            
        # 更新数据库中的排课记录
        schedule = Schedule(
            course_id=schedule_item["course_id"],
            teacher_id=schedule_item["teacher_id"],
            classroom_id=schedule_item["classroom_id"],
            day=schedule_item["day"],
            period=schedule_item["period"]
        )
        db.add(schedule)
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 