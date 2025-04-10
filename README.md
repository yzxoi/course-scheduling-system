# 高校排课系统

一个基于网页的高校排课系统，支持自动排课和手动调整功能。

## 功能特点

- 支持教师、课程、教室等基础数据的管理
- 自动排课算法
- 课表可视化展示
- 支持拖拽调整课程
- 冲突检测与提示

## 技术栈

### 前端
- MDUI
- Axios
- 原生 JavaScript

### 后端
- FastAPI
- SQLAlchemy
- MySQL

## 安装说明

1. 克隆项目
```bash
git clone [项目地址]
cd course_scheduling_system
```

2. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

3. 配置数据库
- 创建 MySQL 数据库
- 修改 `backend/.env` 文件中的数据库连接信息
```
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE course_scheduling CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户并授权（请替换 'your_password' 为安全的密码）
CREATE USER 'course_admin'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON course_scheduling.* TO 'course_admin'@'localhost';
FLUSH PRIVILEGES;
```

4. 启动后端服务
```bash
cd backend
uvicorn main:app --reload
```

5. 启动前端服务
- 使用任意 HTTP 服务器托管 frontend 目录
- 或直接在浏览器中打开 frontend/index.html

## 使用说明

1. 数据导入
- 在相应管理页面导入教师、课程、教室数据
- 支持 CSV 格式导入

2. 排课
- 点击"生成课表"按钮进行自动排课
- 通过拖拽调整课程位置
- 系统会自动检测并提示冲突

## 开发计划

- [ ] 优化排课算法
- [ ] 添加用户认证
- [ ] 支持多学期管理
- [ ] 添加数据导出功能

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License 