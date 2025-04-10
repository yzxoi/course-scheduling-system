// API接口配置
const API_BASE_URL = '/api';

// API请求工具
const api = {
    // 通用请求方法
    request: async function(method, url, data = null, params = null) {
        try {
            const config = {
                method,
                url: API_BASE_URL + url,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                config.data = data;
            }
            
            if (params) {
                config.params = params;
            }
            
            const response = await axios(config);
            return response;
        } catch (error) {
            console.error(`API请求失败: ${method} ${url}`, error);
            throw error;
        }
    },
    
    // 课程管理API
    courses: {
        // 获取课程列表
        list: function() {
            return api.request('get', '/courses');
        },
        
        // 获取单个课程
        get: function(id) {
            return api.request('get', `/courses/${id}`);
        },
        
        // 创建课程
        create: function(data) {
            return api.request('post', '/courses', data);
        },
        
        // 更新课程
        update: function(id, data) {
            return api.request('put', `/courses/${id}`, data);
        },
        
        // 删除课程
        delete: function(id) {
            return api.request('delete', `/courses/${id}`);
        },
        
        // 导入课程
        import: function(formData) {
            return axios.post(API_BASE_URL + '/courses/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        
        // 导出课程
        export: function() {
            return axios.get(API_BASE_URL + '/courses/export', {
                responseType: 'blob'
            });
        }
    },
    
    // 教师管理API
    teachers: {
        // 获取教师列表
        list: function() {
            return api.request('get', '/teachers');
        },
        
        // 获取单个教师
        get: function(id) {
            return api.request('get', `/teachers/${id}`);
        },
        
        // 创建教师
        create: function(data) {
            return api.request('post', '/teachers', data);
        },
        
        // 更新教师
        update: function(id, data) {
            return api.request('put', `/teachers/${id}`, data);
        },
        
        // 删除教师
        delete: function(id) {
            return api.request('delete', `/teachers/${id}`);
        },
        
        // 导入教师
        import: function(formData) {
            return axios.post(API_BASE_URL + '/teachers/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        
        // 导出教师
        export: function() {
            return axios.get(API_BASE_URL + '/teachers/export', {
                responseType: 'blob'
            });
        }
    },
    
    // 教室管理API
    classrooms: {
        // 获取教室列表
        list: function() {
            return api.request('get', '/classrooms');
        },
        
        // 获取单个教室
        get: function(id) {
            return api.request('get', `/classrooms/${id}`);
        },
        
        // 创建教室
        create: function(data) {
            return api.request('post', '/classrooms', data);
        },
        
        // 更新教室
        update: function(id, data) {
            return api.request('put', `/classrooms/${id}`, data);
        },
        
        // 删除教室
        delete: function(id) {
            return api.request('delete', `/classrooms/${id}`);
        },
        
        // 导入教室
        import: function(formData) {
            return axios.post(API_BASE_URL + '/classrooms/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        
        // 导出教室
        export: function() {
            return axios.get(API_BASE_URL + '/classrooms/export', {
                responseType: 'blob'
            });
        }
    },
    
    // 课表管理API
    schedule: {
        // 获取课表列表
        list: function() {
            return api.request('get', '/schedule');
        },
        
        // 获取单个课表
        get: function(id) {
            return api.request('get', `/schedule/${id}`);
        },
        
        // 创建课表
        create: function(data) {
            return api.request('post', '/schedule', data);
        },
        
        // 更新课表
        update: function(id, data) {
            return api.request('put', `/schedule/${id}`, data);
        },
        
        // 删除课表
        delete: function(id) {
            return api.request('delete', `/schedule/${id}`);
        },
        
        // 导入课表
        import: function(formData) {
            return axios.post(API_BASE_URL + '/schedule/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
        },
        
        // 导出课表
        export: function() {
            return axios.get(API_BASE_URL + '/schedule/export', {
                responseType: 'blob'
            });
        },
        
        // 自动排课
        autoSchedule: function() {
            return api.request('post', '/schedule/generate');
        },
        
        // 检查冲突
        checkConflicts: function() {
            return api.request('get', '/schedule/conflicts');
        }
    }
}; 