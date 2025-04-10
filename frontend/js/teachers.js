document.addEventListener('DOMContentLoaded', () => {
	loadTeachers();
	setupFileUpload();
});

async function loadTeachers() {
    try {
        console.log('开始加载教师列表...');
        const response = await api.teachers.list();
        console.log('教师列表响应:', response);
        
        if (!response || !response.data) {
            throw new Error('服务器返回空响应');
        }

		teachers = response.data;
        
        if (Array.isArray(teachers)) {
            renderTeachers(teachers);
        } else {
            console.error('加载教师列表失败: 返回数据不是数组', teachers);
            mdui.snackbar({
                message: '加载教师列表失败: 数据格式错误',
                position: 'right-top'
            });
        }
    } catch (error) {
        console.error('加载教师列表失败:', error);
        mdui.snackbar({
            message: '加载教师列表失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

function renderTeachers(teachers) {
    const teacherList = document.getElementById('teacherList');
    if (!teacherList) {
        console.error('找不到teacherList元素');
        return;
    }
    
    if (!Array.isArray(teachers) || teachers.length === 0) {
        teacherList.innerHTML = '<tr><td colspan="4" class="mdui-text-center">暂无教师数据</td></tr>';
        return;
    }
    
    teacherList.innerHTML = teachers.map(teacher => `
        <tr>
            <td>${teacher.name || ''}</td>
            <td>${teacher.title || '-'}</td>
            <td>${teacher.department || '-'}</td>
            <td>
                <button class="mdui-btn mdui-btn-icon" onclick="editTeacher(${teacher.id})">
                    <i class="mdui-icon material-icons">edit</i>
                </button>
                <button class="mdui-btn mdui-btn-icon" onclick="deleteTeacher(${teacher.id})">
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

async function importTeachers() {
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
        await api.teachers.import(file);
        mdui.snackbar({
            message: '导入成功',
            position: 'right-top'
        });
        loadTeachers();  // 重新加载教师列表
		fileInput.value = ''; // 清空文件输入
		document.getElementById('fileName').textContent = ''; // 清空文件名显示
	} catch (error) {
        mdui.snackbar({
            message: '导入失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

async function editTeacher(teacherId) {
    try {
        const response = await api.teachers.get(teacherId);
        if (!response || !response.data) {
            throw new Error('获取教师信息失败');
        }
        
        const teacher = response.data;
        
        // 填充表单
        document.getElementById('editTeacherId').value = teacher.id;
        document.getElementById('editTeacherName').value = teacher.name || '';
        document.getElementById('editTeacherTitle').value = teacher.title || '';
        document.getElementById('editTeacherDepartment').value = teacher.department || '';
        
        // 打开对话框
        const dialog = new mdui.Dialog('#editTeacherDialog');
        dialog.open();
    } catch (error) {
        console.error('获取教师信息失败:', error);
        mdui.snackbar({
            message: '获取教师信息失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

async function saveTeacher() {
    const teacherId = document.getElementById('editTeacherId').value;
    const teacherData = {
        name: document.getElementById('editTeacherName').value,
        title: document.getElementById('editTeacherTitle').value,
        department: document.getElementById('editTeacherDepartment').value
    };
    
    try {
        await api.teachers.update(teacherId, teacherData);
        mdui.snackbar({
            message: '保存成功',
            position: 'right-top'
        });
        
        // 关闭对话框
        const dialog = new mdui.Dialog('#editTeacherDialog');
        dialog.close();
        
        // 重新加载教师列表
        loadTeachers();
    } catch (error) {
        console.error('保存教师信息失败:', error);
        mdui.snackbar({
            message: '保存失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

function deleteTeacher(teacherId) {
    const confirmDialog = new mdui.Dialog('#confirmDialog', {
        closeOnEsc: true,
        closeOnConfirm: true
    });
    
    confirmDialog.open();
    
    document.getElementById('confirmDialog').addEventListener('confirm', async function() {
        try {
            await api.teachers.delete(teacherId);
            mdui.snackbar({
                message: '删除成功',
                position: 'right-top'
            });
            loadTeachers();  // 重新加载教师列表
        } catch (error) {
            mdui.snackbar({
                message: '删除失败: ' + (error.message || '未知错误'),
                position: 'right-top'
            });
        }
    });
} 