document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    setupFileUpload();
});

async function loadCourses() {
    try {
        console.log('开始加载课程列表...');
        const response = await api.courses.list();
        console.log('课程列表响应:', response);
        
        if (!response || !response.data) {
            throw new Error('服务器返回空响应');
        }

		courses = response.data;
        
        if (Array.isArray(courses)) {
            renderCourses(courses);
        } else {
            console.error('加载课程列表失败: 返回数据不是数组', courses);
            mdui.snackbar({
                message: '加载课程列表失败: 数据格式错误',
                position: 'right-top'
            });
        }
    } catch (error) {
        console.error('加载课程列表失败:', error);
        mdui.snackbar({
            message: '加载课程列表失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

function renderCourses(courses) {
    const courseList = document.getElementById('courseList');
    if (!courseList) {
        console.error('找不到courseList元素');
        return;
    }
    
    if (!Array.isArray(courses) || courses.length === 0) {
        courseList.innerHTML = '<tr><td colspan="5" class="mdui-text-center">暂无课程数据</td></tr>';
        return;
    }
    
    courseList.innerHTML = courses.map(course => `
        <tr>
            <td>${course.name || ''}</td>
            <td>${course.code || ''}</td>
            <td>${course.credits ? course.credits.toFixed(1) : '0.0'}</td>
            <td>${course.hours || 0}</td>
            <td>
                <button class="mdui-btn mdui-btn-icon" onclick="editCourse(${course.id})">
                    <i class="mdui-icon material-icons">edit</i>
                </button>
                <button class="mdui-btn mdui-btn-icon" onclick="deleteCourse(${course.id})">
                    <i class="mdui-icon material-icons">delete</i>
                </button>
            </td>
        </tr>
    `).join('');
}

function setupFileUpload() {
    const fileInput = document.getElementById('csvFile');
    const fileNameSpan = document.getElementById('fileName');
    
    if (!fileInput || !fileNameSpan) {
        console.error('找不到文件上传相关元素');
        return;
    }
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameSpan.textContent = file.name;
        } else {
            fileNameSpan.textContent = '';
        }
    });
}

async function importCourses() {
    const fileInput = document.getElementById('csvFile');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        mdui.snackbar({
            message: '请先选择CSV文件',
            position: 'right-top'
        });
        return;
    }
    
    const file = fileInput.files[0];
    try {
        await api.courses.import(file);
        mdui.snackbar({
            message: '导入成功',
            position: 'right-top'
        });
        loadCourses();  // 重新加载课程列表
        fileInput.value = ''; // 清空文件输入
        document.getElementById('fileName').textContent = ''; // 清空文件名显示
    } catch (error) {
        mdui.snackbar({
            message: '导入失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

async function editCourse(courseId) {
    // TODO: 实现编辑课程功能
    console.log('编辑课程:', courseId);
}

async function deleteCourse(courseId) {
    if (confirm('确定要删除这个课程吗？')) {
        try {
            await api.courses.delete(courseId);
            mdui.snackbar({
                message: '删除成功',
                position: 'right-top'
            });
            loadCourses();  // 重新加载课程列表
        } catch (error) {
            mdui.snackbar({
                message: '删除失败: ' + (error.message || '未知错误'),
                position: 'right-top'
            });
        }
    }
} 