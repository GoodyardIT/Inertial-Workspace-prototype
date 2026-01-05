
import React, { useState, useEffect } from 'react';
import { FORM_JSON, STAFF_RECORDS, STAFF_LIST, DEPARTMENT_LIST, POSITION_LIST, BEHAVIOR_MAPPING } from './constants';
import { FormItem, FormData, UserRole, StaffRecord, ApplicationRequest } from './types';
import { optimizeCaseDescription } from './geminiService';
import { SparklesIcon, CheckCircleIcon, AlertCircleIcon, LoadingSpinner } from './Icons';
import AdminPanel from './AdminPanel';

const App: React.FC = () => {
  // --- 登录与路由 ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<StaffRecord | null>(null);
  const [loginId, setLoginId] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>(window.location.hash || '#/form');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/form';
      setCurrentPath(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) window.location.hash = '#/form';
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
  };

  // --- 数据状态 ---
  const [localStaffRecords, setLocalStaffRecords] = useState<StaffRecord[]>(STAFF_RECORDS);
  const [applications, setApplications] = useState<ApplicationRequest[]>([
    {
      id: 'app-demo-1',
      applicantId: '3',
      applicantName: '李娜',
      title: '重大项目技术攻关',
      dimension: '专业专注',
      description: '解决了政企客户私有化部署中的核心数据库同步延迟问题。',
      requestedScore: 25,
      submitTime: '2024-03-20 10:30',
      status: 'pending'
    }
  ]);

  // --- 表单状态 ---
  const [formData, setFormData] = useState<FormData>({
    apply_date: new Date().toISOString().split('T')[0],
    is_repeat_application: 'no',
    behavior_items: '', // 现在改为单选字符串
    behavior_level: '',
    value_dimension: '',
    total_score: 0,
    case_title: '',
    case_description: '',
    evidence_files: [],
  });

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ feedback_points: string; optimized_content: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 权限守卫
  useEffect(() => {
    if (isLoggedIn && currentPath === '#/admin' && currentUser?.role === 'employee') {
      navigateTo('#/form');
    }
  }, [currentPath, currentUser, isLoggedIn]);

  // Fix: 修改积分计算逻辑。现在 L2 为 5 分，L3 为 10 分，不再按项累加。
  useEffect(() => {
    let score = 0;
    if (formData.behavior_items) {
      if (formData.behavior_level === 'L2') score = 5;
      else if (formData.behavior_level === 'L3') score = 10;
    }
    setFormData(prev => ({ ...prev, total_score: score }));
  }, [formData.behavior_items, formData.behavior_level]);

  // 当维度或层级改变时，重置选中的行为
  useEffect(() => {
    setFormData(prev => ({ ...prev, behavior_items: '' }));
  }, [formData.value_dimension, formData.behavior_level]);

  // --- 处理逻辑 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = localStaffRecords.find(u => u.employeeId.toUpperCase() === loginId.toUpperCase());
    if (user) {
      if (user.status === 'inactive') {
        setLoginError('账号冻结');
        return;
      }
      setCurrentUser(user);
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('无效工号');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigateTo('#/form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const newApp: ApplicationRequest = {
        id: `app-${Date.now()}`,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        title: formData.case_title,
        dimension: formData.value_dimension || '文化价值观',
        description: formData.case_description,
        requestedScore: formData.total_score,
        submitTime: new Date().toLocaleString(),
        status: 'pending'
      };
      setApplications(prev => [newApp, ...prev]);
      setIsSubmitting(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const handleResubmit = (app: ApplicationRequest) => {
    setFormData({
      apply_date: new Date().toISOString().split('T')[0],
      is_repeat_application: 'yes',
      repeat_reason: `针对审批意见“${app.adminOpinion}”进行的修改重新提交。`,
      behavior_items: '',
      behavior_level: '',
      case_title: app.title,
      case_description: app.description,
      value_dimension: app.dimension,
      total_score: app.requestedScore,
      evidence_files: []
    });
    setIsSuccess(false);
    navigateTo('#/form');
  };

  const resetForm = () => {
    setFormData({
      apply_date: new Date().toISOString().split('T')[0],
      is_repeat_application: 'no',
      behavior_items: '',
      behavior_level: '',
      value_dimension: '',
      total_score: 0,
      case_title: '',
      case_description: '',
      evidence_files: [],
    });
    setAiFeedback(null);
    setIsSuccess(false);
    navigateTo('#/form');
  };

  const handleAiOptimize = async () => {
    if (!formData.case_title || !formData.case_description) {
      alert("请先填写案例标题和描述。");
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await optimizeCaseDescription(
        formData.case_title,
        formData.value_dimension || '通用',
        formData.case_description
      );
      setAiFeedback(result);
    } catch (error) {
      console.error("AI Modification suggestions failed", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiFeedback) {
      setFormData(prev => ({ ...prev, case_description: aiFeedback.optimized_content }));
      setAiFeedback(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map((f: any) => f.name);
      setFormData(prev => ({
        ...prev,
        evidence_files: [...(prev.evidence_files || []), ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence_files: prev.evidence_files?.filter((_: any, i: number) => i !== index)
    }));
  };

  const renderField = (item: FormItem) => {
    const isHidden = item.name === 'repeat_reason' && formData.is_repeat_application === 'no';
    if (isHidden || item.hidden) return null;
    const label = <label className="block text-sm font-bold text-gray-700 mb-2">{item.label} {item.required && <span className="text-red-500">*</span>}</label>;
    
    switch (item.componentName) {
      case 'HeaderField':
        return <div key={`h-${item.props.title}`} className="mt-10 mb-6 border-l-4 border-blue-600 pl-4"><h3 className="text-lg font-black text-gray-900">{item.props.title}</h3>{item.props.description && <p className="text-xs text-gray-400 mt-1">{item.props.description}</p>}</div>;
      
      case 'DDInputField':
      case 'NumberField':
        return <div key={item.name} className="mb-6">{label}<input type="text" placeholder={item.props.placeholder} disabled={item.props.disabled} value={formData[item.name!] ?? ''} onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition ${item.props.disabled ? 'bg-gray-50' : 'bg-white'}`} /></div>;
      
      case 'DDTextAreaField':
        return (
          <div key={item.name} className="mb-6">
            <div className="flex justify-between items-center mb-1">
              {label}
              {item.name === 'case_description' && (
                <button 
                  type="button" 
                  disabled={isAiLoading}
                  onClick={handleAiOptimize} 
                  className="flex items-center space-x-1 text-blue-600 text-[10px] font-black hover:text-blue-700 transition disabled:opacity-50"
                >
                  {isAiLoading ? <LoadingSpinner className="w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                  <span>文案修改建议</span>
                </button>
              )}
            </div>
            <textarea 
              rows={item.props.rows} 
              placeholder={item.props.placeholder}
              value={formData[item.name!] || ''} 
              onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition" 
            />
            {item.name === 'case_description' && aiFeedback && (
              <div className="mt-3 bg-blue-50 p-5 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-start mb-3">
                   <p className="text-[10px] font-black text-blue-600 uppercase flex items-center">
                     <SparklesIcon className="w-3 h-3 mr-1" /> AI 修改建议
                   </p>
                   <button type="button" onClick={() => setAiFeedback(null)} className="text-[10px] font-black text-gray-400 hover:text-gray-600">关闭建议</button>
                </div>
                
                <div className="text-xs text-gray-700 space-y-3 leading-relaxed whitespace-pre-wrap font-medium">
                  {aiFeedback.feedback_points}
                </div>

                <div className="mt-5 pt-4 border-t border-blue-100">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-blue-600 uppercase">优化后的完整版本：</p>
                    <button type="button" onClick={applyAiSuggestion} className="text-[10px] font-black bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition">一键采用全文</button>
                  </div>
                  <div className="bg-white/60 p-3 rounded-xl text-xs text-gray-600 italic border border-blue-50">
                    {aiFeedback.optimized_content}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'DDSelectField':
      case 'DepartmentPicker':
        let opts = item.props.options || (item.props.dataSource === 'staffList' ? STAFF_LIST : (item.componentName === 'DepartmentPicker' ? DEPARTMENT_LIST : POSITION_LIST));
        return <div key={item.name} className="mb-6">{label}<select value={formData[item.name!] || ''} onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-50 transition"><option value="">请选择{item.label}</option>{opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
      
      case 'DDDateField':
        return <div key={item.name} className="mb-6">{label}<input type="date" value={formData[item.name!] || ''} onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-50 transition" /></div>;

      case 'DDRadioField':
        return <div key={item.name} className="mb-6">{label}<div className="flex flex-wrap gap-4 mt-2">{item.props.options?.map(o => <label key={o.value} className={`flex items-center space-x-2 px-4 py-2 border rounded-xl cursor-pointer transition ${formData[item.name!] === o.value ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}><input type="radio" className="hidden" checked={formData[item.name!] === o.value} onChange={() => setFormData({...formData, [item.name!]: o.value})} /> <span className="text-sm font-bold">{o.label}</span></label>)}</div></div>;

      // Fix: 新的行为范例选择组件，支持维度与层级的动态过滤
      case 'BehaviorSelector':
        const dim = formData.value_dimension;
        const level = formData.behavior_level;
        const matchedOptions = (dim && level) ? BEHAVIOR_MAPPING[dim]?.[level] : null;

        return (
          <div key={item.name} className="mb-6">
            {label}
            {!dim || !level ? (
              <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                <p className="text-xs text-gray-400 font-bold">请先选择“文化价值观维度”和“行为层级”</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matchedOptions?.map((optStr, idx) => (
                  <label 
                    key={idx} 
                    className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${
                      formData.behavior_items === optStr 
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input 
                      type="radio" 
                      className="mt-1"
                      checked={formData.behavior_items === optStr} 
                      onChange={() => setFormData({...formData, behavior_items: optStr})} 
                    />
                    <div className="ml-3">
                      <div className={`text-xs font-black transition-colors ${formData.behavior_items === optStr ? 'text-blue-700' : 'text-gray-800'}`}>
                        {optStr.split('（')[0]}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        {optStr.includes('（') ? `（${optStr.split('（')[1]}` : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        );

      case 'DDAttachment':
        return (
          <div key={item.name} className="mb-6">
            {label}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formData.evidence_files?.map((name: string, i: number) => (
                <div key={i} className="relative group aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-2">
                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm mb-1">
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   </div>
                   <span className="text-[9px] text-gray-400 font-bold truncate w-full text-center">{name}</span>
                   <button type="button" onClick={() => removeFile(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
              <label className="aspect-square bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition">
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                <svg className="w-8 h-8 text-blue-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-[10px] font-black text-blue-500 uppercase">点击上传</span>
              </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">最多支持上传 {item.props.maxCount} 个文件，每个不超过 {item.props.maxSize}MB</p>
          </div>
        );

      case 'NoteField':
        return <div key={item.name} className="mt-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100"><h5 className="text-xs font-black text-amber-700 mb-3 flex items-center"><AlertCircleIcon className="w-4 h-4 mr-2" /> 填写须知</h5><div className="text-xs text-amber-600/80 leading-relaxed whitespace-pre-wrap font-medium">{item.props.text}</div></div>;

      default: return null;
    }
  };

  const MyHistory = () => {
    const myApps = applications.filter(a => a.applicantId === currentUser?.id);
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        <div className="mb-6">
          <h2 className="text-xl font-black text-gray-900">我的申报历史</h2>
          <p className="text-xs text-gray-400 font-medium">查看审批状态并处理被驳回的申请</p>
        </div>
        {myApps.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border border-gray-100">
            <p className="text-gray-400 font-bold">暂无提交记录</p>
          </div>
        ) : (
          myApps.map(app => (
            <div key={app.id} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-50 relative overflow-hidden transition-all hover:shadow-xl">
               <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl ${
                 app.status === 'approved' ? 'bg-green-100 text-green-700' : 
                 app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
               }`}>
                 {app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '已驳回' : '待审批'}
               </div>
               <div className="mb-4">
                 <span className="text-[10px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-0.5 rounded mr-2">{app.dimension}</span>
                 <h4 className="inline-block font-black text-gray-900">{app.title}</h4>
                 <p className="text-[10px] text-gray-400 mt-1 font-mono">{app.submitTime}</p>
               </div>
               <p className="text-xs text-gray-500 line-clamp-2 italic mb-4">"{app.description}"</p>
               
               {app.status === 'rejected' && (
                 <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-4 animate-in slide-in-from-top-2">
                   <p className="text-[10px] font-black text-red-600 uppercase mb-1">管理员驳回意见：</p>
                   <p className="text-xs text-red-800 font-bold">{app.adminOpinion || "未填写具体原因"}</p>
                   <button 
                     onClick={() => handleResubmit(app)}
                     className="mt-3 w-full py-3 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg shadow-red-100 hover:bg-red-700 transition"
                   >
                     修改并重新提交
                   </button>
                 </div>
               )}
               
               <div className="flex justify-between items-center border-t border-gray-50 pt-4">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">申请分值</span>
                  <span className="text-xl font-black text-blue-600 tabular-nums">+{app.requestedScore}</span>
               </div>
            </div>
          ))
        )}
      </div>
    );
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-50 text-center">
        <h1 className="text-2xl font-black mb-6">文化积分系统</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="text" value={loginId} onChange={(e)=>setLoginId(e.target.value)} placeholder="输入工号 (DT001-DT005)" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none font-bold" />
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">登录</button>
          {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white sticky top-0 z-50 border-b p-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><img src={FORM_JSON.icon} className="w-5 h-5 invert" /></div>
           <h1 className="font-black text-gray-900">文化门户</h1>
        </div>
        <div className="flex items-center space-x-3">
           <div className="text-right">
             <p className="text-[10px] font-black text-gray-400">{currentUser?.name}</p>
             <p className="text-[10px] font-black text-blue-600">积分: {currentUser?.score}</p>
           </div>
           <button onClick={handleLogout} className="text-[10px] font-black text-gray-300 uppercase">退出</button>
        </div>
      </header>

      <nav className="max-w-2xl mx-auto mt-6 px-6">
        <div className="flex bg-gray-200/50 p-1 rounded-2xl">
          <button onClick={()=>navigateTo('#/form')} className={`flex-1 py-2 rounded-xl text-xs font-black ${currentPath==='#/form'?'bg-white text-blue-600':'text-gray-400'}`}>积分申报</button>
          {currentUser?.role === 'employee' ? (
            <button onClick={()=>navigateTo('#/history')} className={`flex-1 py-2 rounded-xl text-xs font-black ${currentPath==='#/history'?'bg-white text-blue-600':'text-gray-400'}`}>我的申请</button>
          ) : (
            <button onClick={()=>navigateTo('#/admin')} className={`flex-1 py-2 rounded-xl text-xs font-black ${currentPath==='#/admin'?'bg-white text-blue-600':'text-gray-400'}`}>管理后台</button>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto mt-8 px-6">
        {currentPath === '#/form' ? (
          isSuccess ? (
            <div className="bg-white p-12 rounded-[2rem] text-center shadow-lg animate-in zoom-in-95"><CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" /><h2 className="text-2xl font-black mb-2">提交成功</h2><p className="text-gray-400 text-sm mb-8">您的申请已进入审批流程，请耐心等待。</p><button onClick={resetForm} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black">返回填写</button></div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-50 mb-10">
              <div className="bg-blue-600 p-6 rounded-3xl text-white mb-8 text-sm font-bold shadow-lg shadow-blue-100">{FORM_JSON.description}</div>
              {FORM_JSON.items.map(renderField)}
              <div className="mt-12 bg-gray-900 p-8 rounded-[2rem] text-white flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl">
                <div><p className="text-[10px] opacity-50 uppercase tracking-widest mb-1">本次申报积分</p><p className="text-4xl font-black tabular-nums">+{formData.total_score}</p></div>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-12 py-4 bg-blue-600 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50">
                  {isSubmitting ? '提交中...' : '提交申请'}
                </button>
              </div>
            </form>
          )
        ) : currentPath === '#/history' ? (
          <MyHistory />
        ) : (
          <AdminPanel currentUserRole={currentUser?.role || 'employee'} staffRecords={localStaffRecords} applications={applications} onUpdateStaff={setLocalStaffRecords} onUpdateApplications={setApplications} />
        )}
      </main>
    </div>
  );
};

export default App;
