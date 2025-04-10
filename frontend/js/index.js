// 全局变量
let currentView = 'teacher'; // 当前视图：teacher, classroom, course
let scheduleData = []; // 课表数据
let conflictData = []; // 冲突数据
let teachers = []; // 教师列表
let classrooms = []; // 教室列表
let courses = []; // 课程列表

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化MDUI组件
    mdui.mutation();
    
    // 加载初始数据
    loadInitialData();
    
    // 初始化课表网格
    initScheduleGrid();
});

// 加载初始数据
async function loadInitialData() {
    try {
        // 加载教师列表
        const teachersResponse = await api.teachers.list();
        teachers = teachersResponse.data || [];
        updateTeacherFilter(teachers);
        
        // 加载教室列表
        const classroomsResponse = await api.classrooms.list();
        classrooms = classroomsResponse.data || [];
        updateClassroomFilter(classrooms);
        
        // 加载课程列表
        const coursesResponse = await api.courses.list();
        courses = coursesResponse.data || [];
        
        // 加载课表数据
        await loadScheduleData();
        
        // 更新统计信息
        updateStats();
    } catch (error) {
        console.error('加载数据失败:', error);
        mdui.snackbar({
            message: '加载数据失败，请刷新页面重试',
            position: 'top',
            timeout: 3000
        });
    }
}

// 加载课表数据
async function loadScheduleData() {
    try {
        const response = await api.schedule.list();
        scheduleData = response.data || [];
        renderSchedule();
    } catch (error) {
        console.error('加载课表失败:', error);
        mdui.snackbar({
            message: '加载课表失败，请刷新页面重试',
            position: 'top',
            timeout: 3000
        });
        // 确保scheduleData是数组，即使加载失败
        scheduleData = [];
        renderSchedule();
    }
}

// 初始化课表网格
function initScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');
    grid.innerHTML = '';
    
    // 创建表头
    const headerRow = document.createElement('div');
    headerRow.className = 'schedule-row header';
    
    // 添加时间列
    const timeCell = document.createElement('div');
    timeCell.className = 'schedule-cell header-cell';
    timeCell.textContent = '时间';
    headerRow.appendChild(timeCell);
    
    // 添加星期列
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    weekdays.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'schedule-cell header-cell';
        cell.textContent = day;
        headerRow.appendChild(cell);
    });
    
    grid.appendChild(headerRow);
    
    // 创建时间段行
    const timeSlots = [
        '第一节 (8:00-9:40)',
        '第二节 (10:00-11:40)',
        '第三节 (14:00-15:40)',
        '第四节 (16:00-17:40)',
        '第五节 (19:00-20:40)'
    ];
    
    timeSlots.forEach(timeSlot => {
        const row = document.createElement('div');
        row.className = 'schedule-row';
        
        // 添加时间单元格
        const timeCell = document.createElement('div');
        timeCell.className = 'schedule-cell time-cell';
        timeCell.textContent = timeSlot;
        row.appendChild(timeCell);
        
        // 添加课程单元格
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell';
            cell.dataset.day = i + 1;
            cell.dataset.timeSlot = timeSlot;
            row.appendChild(cell);
        }
        
        grid.appendChild(row);
    });
}

// 渲染课表
function renderSchedule() {
    // 清空现有课程
    const cells = document.querySelectorAll('.schedule-cell:not(.header-cell):not(.time-cell)');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('conflict');
    });
    
    // 确保scheduleData是数组
    if (!Array.isArray(scheduleData)) {
        console.error('scheduleData不是数组:', scheduleData);
        scheduleData = [];
    }
    
    // 根据当前视图渲染课表
    switch (currentView) {
        case 'teacher':
            renderTeacherView();
            break;
        case 'classroom':
            renderClassroomView();
            break;
        case 'course':
            renderCourseView();
            break;
    }
    
    // 检查并显示冲突
    checkConflicts();
}

// 渲染教师视图
function renderTeacherView() {
    const selectedTeacher = document.getElementById('teacherFilter').value;
    
    if (!Array.isArray(scheduleData)) {
        console.error('renderTeacherView: scheduleData不是数组');
        return;
    }
    
    scheduleData.forEach(schedule => {
        if (!selectedTeacher || schedule.teacher_id === parseInt(selectedTeacher)) {
            const cell = findScheduleCell(schedule.day, schedule.time_slot);
            if (cell) {
                addCourseToCell(cell, schedule);
            }
        }
    });
}

// 渲染教室视图
function renderClassroomView() {
    const selectedClassroom = document.getElementById('classroomFilter').value;
    
    if (!Array.isArray(scheduleData)) {
        console.error('renderClassroomView: scheduleData不是数组');
        return;
    }
    
    scheduleData.forEach(schedule => {
        if (!selectedClassroom || schedule.classroom_id === parseInt(selectedClassroom)) {
            const cell = findScheduleCell(schedule.day, schedule.time_slot);
            if (cell) {
                addCourseToCell(cell, schedule);
            }
        }
    });
}

// 渲染课程视图
function renderCourseView() {
    if (!Array.isArray(scheduleData)) {
        console.error('renderCourseView: scheduleData不是数组');
        return;
    }
    
    scheduleData.forEach(schedule => {
        const cell = findScheduleCell(schedule.day, schedule.time_slot);
        if (cell) {
            addCourseToCell(cell, schedule);
        }
    });
}

// 查找课表单元格
function findScheduleCell(day, timeSlot) {
    return document.querySelector(`.schedule-cell[data-day="${day}"][data-time-slot="${timeSlot}"]`);
}

// 添加课程到单元格
function addCourseToCell(cell, schedule) {
    if (!cell || !schedule) return;
    
    const course = courses.find(c => c.id === schedule.course_id);
    const teacher = teachers.find(t => t.id === schedule.teacher_id);
    const classroom = classrooms.find(c => c.id === schedule.classroom_id);
    
    if (course && teacher && classroom) {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-item';
        courseElement.innerHTML = `
            <div class="course-name">${course.name}</div>
            <div class="course-teacher">${teacher.name}</div>
            <div class="course-classroom">${classroom.name}</div>
        `;
        
        courseElement.onclick = () => showCourseDetail(schedule);
        
        cell.appendChild(courseElement);
    }
}

// 显示课程详情
function showCourseDetail(schedule) {
    if (!schedule) return;
    
    const course = courses.find(c => c.id === schedule.course_id);
    const teacher = teachers.find(t => t.id === schedule.teacher_id);
    const classroom = classrooms.find(c => c.id === schedule.classroom_id);
    
    if (course && teacher && classroom) {
        document.getElementById('detailCourseName').textContent = course.name;
        document.getElementById('detailCourseTime').textContent = `${schedule.day} ${schedule.time_slot}`;
        document.getElementById('detailTeacherName').textContent = teacher.name;
        document.getElementById('detailClassroomName').textContent = classroom.name;
        
        const dialog = new mdui.Dialog('#courseDetailDialog');
        dialog.open();
    }
}

// 切换视图
function switchView(view) {
    currentView = view;
    
    // 更新按钮状态
    document.querySelectorAll('.view-toggle .mdui-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.view-toggle .mdui-btn:nth-child(${
        view === 'teacher' ? 1 : view === 'classroom' ? 2 : 3
    })`).classList.add('active');
    
    // 重新渲染课表
    renderSchedule();
}

// 更新教师过滤器
function updateTeacherFilter(teachers) {
    const select = document.getElementById('teacherFilter');
    if (!select) return;
    
    select.innerHTML = '<option value="">所有教师</option>';
    
    if (Array.isArray(teachers)) {
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            select.appendChild(option);
        });
    }
}

// 更新教室过滤器
function updateClassroomFilter(classrooms) {
    const select = document.getElementById('classroomFilter');
    if (!select) return;
    
    select.innerHTML = '<option value="">所有教室</option>';
    
    if (Array.isArray(classrooms)) {
        classrooms.forEach(classroom => {
            const option = document.createElement('option');
            option.value = classroom.id;
            option.textContent = classroom.name;
            select.appendChild(option);
        });
    }
}

// 更新统计信息
function updateStats() {
    const totalCoursesEl = document.getElementById('totalCourses');
    const totalTeachersEl = document.getElementById('totalTeachers');
    const totalClassroomsEl = document.getElementById('totalClassrooms');
    const conflictCountEl = document.getElementById('conflictCount');
    
    if (totalCoursesEl) totalCoursesEl.textContent = Array.isArray(courses) ? courses.length : 0;
    if (totalTeachersEl) totalTeachersEl.textContent = Array.isArray(teachers) ? teachers.length : 0;
    if (totalClassroomsEl) totalClassroomsEl.textContent = Array.isArray(classrooms) ? classrooms.length : 0;
    if (conflictCountEl) conflictCountEl.textContent = Array.isArray(conflictData) ? conflictData.length : 0;
}

// 检查冲突
async function checkConflicts() {
    try {
        const response = await api.schedule.checkConflicts();
        if (response.success) {
            const conflicts = response.data || [];
            if (conflicts.length > 0) {
                // 显示冲突面板
                const conflictPanel = document.getElementById('conflictPanel');
                const conflictList = document.getElementById('conflictList');
                
                // 清空现有冲突列表
                conflictList.innerHTML = '';
                
                // 添加冲突项
                conflicts.forEach(conflict => {
                    const conflictItem = document.createElement('div');
                    conflictItem.className = 'conflict-item';
                    conflictItem.innerHTML = `
                        <div class="conflict-time">${conflict.day} ${conflict.time_slot}</div>
                        <div class="conflict-courses">
                            <div class="conflict-course">
                                <div class="course-name">${conflict.course1_name}</div>
                                <div class="course-teacher">${conflict.teacher1_name}</div>
                                <div class="course-classroom">${conflict.classroom1_name}</div>
                            </div>
                            <div class="conflict-vs">VS</div>
                            <div class="conflict-course">
                                <div class="course-name">${conflict.course2_name}</div>
                                <div class="course-teacher">${conflict.teacher2_name}</div>
                                <div class="course-classroom">${conflict.classroom2_name}</div>
                            </div>
                        </div>
                    `;
                    conflictList.appendChild(conflictItem);
                });
                
                // 显示冲突面板
                conflictPanel.style.display = 'block';
                
                // 更新冲突统计
                document.getElementById('conflictCount').textContent = conflicts.length;
                
                mdui.snackbar({
                    message: `发现 ${conflicts.length} 个冲突`,
                    position: 'top'
                });
            } else {
                mdui.snackbar({
                    message: '未发现冲突',
                    position: 'top'
                });
            }
        } else {
            mdui.snackbar({
                message: response.message || '检查冲突失败',
                position: 'top'
            });
        }
    } catch (error) {
        console.error('检查冲突失败:', error);
        mdui.snackbar({
            message: '检查冲突失败，请重试',
            position: 'top'
        });
    }
}

// 切换显示冲突
function toggleConflicts() {
    const showConflictsCheckbox = document.getElementById('showConflicts');
    if (!showConflictsCheckbox) return;
    
    if (showConflictsCheckbox.checked) {
        showConflicts();
    } else {
        document.querySelectorAll('.schedule-cell').forEach(cell => {
            cell.classList.remove('conflict');
        });
    }
}

// 切换显示空时段
function toggleEmpty() {
    const showEmptyCheckbox = document.getElementById('showEmpty');
    if (!showEmptyCheckbox) return;
    
    const showEmpty = showEmptyCheckbox.checked;
    document.querySelectorAll('.schedule-cell:not(.header-cell):not(.time-cell)').forEach(cell => {
        if (showEmpty || cell.children.length > 0) {
            cell.style.display = 'block';
        } else {
            cell.style.display = 'none';
        }
    });
}

// 过滤课表
function filterSchedule() {
    renderSchedule();
}

// 自动排课
async function autoSchedule() {
    try {
        const response = await api.schedule.autoSchedule();
        if (response.success) {
            mdui.snackbar({
                message: '自动排课成功',
                position: 'top'
            });
            await loadScheduleData();
        } else {
            mdui.snackbar({
                message: response.message || '自动排课失败',
                position: 'top'
            });
        }
    } catch (error) {
        console.error('自动排课失败:', error);
        mdui.snackbar({
            message: '自动排课失败，请重试',
            position: 'top'
        });
    }
}

// 导出课表
async function exportSchedule() {
    try {
        const response = await api.schedule.export();
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '课表.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('导出课表失败:', error);
        mdui.snackbar({
            message: '导出课表失败，请重试',
            position: 'top',
            timeout: 3000
        });
    }
}

// 导入课表
async function importSchedule() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const response = await api.schedule.import(formData);
                if (response.data && response.data.success) {
                    mdui.snackbar({
                        message: '导入课表成功',
                        position: 'top',
                        timeout: 3000
                    });
                    await loadScheduleData();
                } else {
                    mdui.snackbar({
                        message: '导入课表失败: ' + (response.data ? response.data.message : '未知错误'),
                        position: 'top',
                        timeout: 3000
                    });
                }
            } catch (error) {
                console.error('导入课表失败:', error);
                mdui.snackbar({
                    message: '导入课表失败，请重试',
                    position: 'top',
                    timeout: 3000
                });
            }
        }
    };
    
    input.click();
} 