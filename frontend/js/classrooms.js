// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadClassrooms();
    setupFileUpload();
});

async function loadClassrooms() {
    try {
        console.log('开始加载教室列表...');
        const response = await api.classrooms.list();
        console.log('教室列表响应:', response);
        
        if (!response || !response.data) {
            throw new Error('服务器返回空响应');
        }

		classrooms = response.data;
        
        if (Array.isArray(classrooms)) {
            renderClassrooms(classrooms);
        } else {
            console.error('加载教室列表失败: 返回数据不是数组', classrooms);
            mdui.snackbar({
                message: '加载教室列表失败: 数据格式错误',
                position: 'right-top'
            });
        }
    } catch (error) {
        console.error('加载教室列表失败:', error);
        mdui.snackbar({
            message: '加载教室列表失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

// 渲染教室列表
function renderClassrooms(classrooms) {
    const classroomList = document.getElementById('classroomList');
    if (!classroomList) {
        console.error('找不到classroomList元素');
        return;
    }
    
    if (!Array.isArray(classrooms) || classrooms.length === 0) {
        classroomList.innerHTML = '<tr><td colspan="4" class="mdui-text-center">暂无教室数据</td></tr>';
        return;
    }
    
    classroomList.innerHTML = classrooms.map(classroom => `
        <tr>
            <td>${classroom.name || ''}</td>
            <td>${classroom.capacity || 0}</td>
            <td>${classroom.building || ''}</td>
            <td>
                <button class="mdui-btn mdui-btn-icon" onclick="editClassroom(${classroom.id})">
                    <i class="mdui-icon material-icons">edit</i>
                </button>
                <button class="mdui-btn mdui-btn-icon" onclick="deleteClassroom(${classroom.id})">
                    <i class="mdui-icon material-icons">delete</i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 加载教室使用情况统计
async function loadClassroomStats() {
    try {
        // 加载使用情况统计
        const usageResponse = await axios.get('/api/classrooms/stats/usage/');
        const usageStats = usageResponse.data;
        
        // 加载容量统计
        const capacityResponse = await axios.get('/api/classrooms/stats/capacity/');
        const capacityStats = capacityResponse.data;
        
        // 渲染使用情况图表
        renderUsageChart(usageStats);
        
        // 渲染容量分布图表
        renderCapacityChart(capacityStats);
        
        // 渲染使用详情表格
        renderUsageDetails(usageStats);
    } catch (error) {
        mdui.snackbar({
            message: '加载教室使用情况统计失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

// 渲染使用情况图表
function renderUsageChart(usageStats) {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    // 准备数据
    const labels = usageStats.classroom_details.map(item => item.name);
    const data = usageStats.classroom_details.map(item => item.schedule_count);
    
    // 创建图表
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '课程安排数量',
                data: data,
                backgroundColor: 'rgba(63, 81, 181, 0.6)',
                borderColor: 'rgba(63, 81, 181, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 渲染容量分布图表
function renderCapacityChart(capacityStats) {
    const ctx = document.getElementById('capacityChart').getContext('2d');
    
    // 准备数据
    const labels = Object.keys(capacityStats.capacity_groups);
    const data = Object.values(capacityStats.capacity_groups);
    
    // 创建图表
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

// 渲染使用详情表格
function renderUsageDetails(usageStats) {
    const usageDetails = document.getElementById('usageDetails');
    usageDetails.innerHTML = usageStats.classroom_details.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.capacity}</td>
            <td>${item.building}</td>
            <td>${item.schedule_count}</td>
            <td>
                <div class="mdui-progress">
                    <div class="mdui-progress-determinate" style="width: ${item.usage_percentage}%;"></div>
                </div>
                <span>${item.usage_percentage}%</span>
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

async function importClassrooms() {
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
        await api.classroom.import(file);
        mdui.snackbar({
            message: '导入成功',
            position: 'right-top'
        });
        loadClassrooms();  // 重新加载课程列表
        fileInput.value = ''; // 清空文件输入
        document.getElementById('fileName').textContent = ''; // 清空文件名显示
    } catch (error) {
        mdui.snackbar({
            message: '导入失败: ' + (error.message || '未知错误'),
            position: 'right-top'
        });
    }
}

// 编辑教室
async function editClassroom(id) {
    try {
        // 获取教室详情
        const response = await axios.get(`/api/v1/classrooms/${id}`);
        const classroom = response.data;
        
        // 创建编辑对话框
        const dialog = document.createElement('div');
        dialog.className = 'mdui-dialog';
        dialog.innerHTML = `
            <div class="mdui-dialog-title">编辑教室</div>
            <div class="mdui-dialog-content">
                <form id="editClassroomForm">
                    <div class="mdui-textfield">
                        <label class="mdui-textfield-label">教室名称</label>
                        <input class="mdui-textfield-input" type="text" name="name" value="${classroom.name}" required/>
                    </div>
                    <div class="mdui-textfield">
                        <label class="mdui-textfield-label">容量</label>
                        <input class="mdui-textfield-input" type="number" name="capacity" value="${classroom.capacity}" required/>
                    </div>
                    <div class="mdui-textfield">
                        <label class="mdui-textfield-label">所在建筑</label>
                        <input class="mdui-textfield-input" type="text" name="building" value="${classroom.building}" required/>
                    </div>
                </form>
            </div>
            <div class="mdui-dialog-actions">
                <button class="mdui-btn mdui-ripple" mdui-dialog-close>取消</button>
                <button class="mdui-btn mdui-btn-raised mdui-ripple mdui-text-color-theme" onclick="updateClassroom(${id})">保存</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        const dialogInstance = new mdui.Dialog(dialog);
        dialogInstance.open();
    } catch (error) {
        showSnackbar('获取教室信息失败：' + (error.response?.data?.detail || error.message));
    }
}

// 更新教室信息
async function updateClassroom(id) {
    try {
        const form = document.getElementById('editClassroomForm');
        const formData = new FormData(form);
        const classroomData = {
            name: formData.get('name'),
            capacity: parseInt(formData.get('capacity')),
            building: formData.get('building')
        };
        
        // 验证数据
        if (!classroomData.name || !classroomData.capacity || !classroomData.building) {
            showSnackbar('请填写所有必填字段');
            return;
        }
        
        if (classroomData.capacity <= 0) {
            showSnackbar('教室容量必须大于0');
            return;
        }
        
        await axios.put(`/api/v1/classrooms/${id}`, classroomData);
        
        // 关闭对话框
        const dialog = document.querySelector('.mdui-dialog');
        const dialogInstance = new mdui.Dialog(dialog);
        dialogInstance.close();
        
        // 移除对话框元素
        setTimeout(() => {
            document.body.removeChild(dialog);
        }, 300);
        
        showSnackbar('教室信息更新成功');
        loadClassrooms();
    } catch (error) {
        showSnackbar('更新教室信息失败：' + (error.response?.data?.detail || error.message));
    }
}

// 删除教室
async function deleteClassroom(id) {
    if (!confirm('确定要删除这个教室吗？')) {
        return;
    }

    try {
        await axios.delete(`/api/v1/classrooms/${id}`);
        showSnackbar('教室删除成功');
        loadClassrooms();
    } catch (error) {
        showSnackbar('教室删除失败：' + (error.response?.data?.detail || error.message));
    }
}

// 添加新教室
function addClassroom() {
    // 创建添加教室对话框
    const dialog = document.createElement('div');
    dialog.className = 'mdui-dialog';
    dialog.innerHTML = `
        <div class="mdui-dialog-title">添加教室</div>
        <div class="mdui-dialog-content">
            <form id="addClassroomForm">
                <div class="mdui-textfield">
                    <label class="mdui-textfield-label">教室名称</label>
                    <input class="mdui-textfield-input" type="text" name="name" required/>
                </div>
                <div class="mdui-textfield">
                    <label class="mdui-textfield-label">容量</label>
                    <input class="mdui-textfield-input" type="number" name="capacity" required/>
                </div>
                <div class="mdui-textfield">
                    <label class="mdui-textfield-label">所在建筑</label>
                    <input class="mdui-textfield-input" type="text" name="building" required/>
                </div>
            </form>
        </div>
        <div class="mdui-dialog-actions">
            <button class="mdui-btn mdui-ripple" mdui-dialog-close>取消</button>
            <button class="mdui-btn mdui-btn-raised mdui-ripple mdui-text-color-theme" onclick="saveNewClassroom()">保存</button>
        </div>
    `;
    
    document.body.appendChild(dialog);
    const dialogInstance = new mdui.Dialog(dialog);
    dialogInstance.open();
}

// 保存新教室
async function saveNewClassroom() {
    try {
        const form = document.getElementById('addClassroomForm');
        const formData = new FormData(form);
        const classroomData = {
            name: formData.get('name'),
            capacity: parseInt(formData.get('capacity')),
            building: formData.get('building')
        };
        
        // 验证数据
        if (!classroomData.name || !classroomData.capacity || !classroomData.building) {
            showSnackbar('请填写所有必填字段');
            return;
        }
        
        if (classroomData.capacity <= 0) {
            showSnackbar('教室容量必须大于0');
            return;
        }
        
        await axios.post('/api/v1/classrooms', classroomData);
        
        // 关闭对话框
        const dialog = document.querySelector('.mdui-dialog');
        const dialogInstance = new mdui.Dialog(dialog);
        dialogInstance.close();
        
        // 移除对话框元素
        setTimeout(() => {
            document.body.removeChild(dialog);
        }, 300);
        
        showSnackbar('教室添加成功');
        loadClassrooms();
    } catch (error) {
        showSnackbar('添加教室失败：' + (error.response?.data?.detail || error.message));
    }
}

// 显示提示消息
function showSnackbar(message) {
    const snackbarContainer = document.createElement('div');
    snackbarContainer.className = 'mdui-snackbar';
    snackbarContainer.innerHTML = `
        <div class="mdui-snackbar-text">${message}</div>
        <div class="mdui-snackbar-action">
            <button class="mdui-btn mdui-btn-flat mdui-ripple mdui-snackbar-close">关闭</button>
        </div>
    `;
    document.body.appendChild(snackbarContainer);
    const snackbar = new mdui.Snackbar(snackbarContainer);
    snackbar.open();
} 