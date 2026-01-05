
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
  const [loginPassword, setLoginPassword] = useState<string>('');
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
  const [applications, setApplications] = useState<ApplicationRequest[]>([]);

  // --- 表单状态 ---
  const [formData, setFormData] = useState<FormData>({
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

  useEffect(() => {
    let score = 0;
    if (formData.behavior_items) {
      if (formData.behavior_level === 'L2') score = 5;
      else if (formData.behavior_level === 'L3') score = 10;
    }
    setFormData(prev => ({ ...prev, total_score: score }));
  }, [formData.behavior_items, formData.behavior_level]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, behavior_items: '' }));
  }, [formData.value_dimension, formData.behavior_level]);

  // --- 处理逻辑 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userIndex = localStaffRecords.findIndex(u => u.employeeId.toUpperCase() === loginId.toUpperCase());
    if (userIndex !== -1) {
      const user = localStaffRecords[userIndex];
      if (user.status === 'inactive') {
        setLoginError('账号冻结');
        return;
      }
      if (user.password !== loginPassword) {
        setLoginError('密码错误');
        return;
      }

      // 更新登录计数逻辑
      const updatedRecords = [...localStaffRecords];
      updatedRecords[userIndex] = {
        ...user,
        loginCount: user.loginCount + 1
      };
      
      setLocalStaffRecords(updatedRecords);
      setCurrentUser(updatedRecords[userIndex]);
      setIsLoggedIn(true);
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('无效工号');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginId('');
    setLoginPassword('');
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
        return <div key={`h-${item.props.title}`} className="mt-8 mb-4 border-l-4 border-blue-600 pl-3"><h3 className="text-base font-black text-gray-900">{item.props.title}</h3>{item.props.description && <p className="text-[11px] text-gray-400 mt-0.5">{item.props.description}</p>}</div>;
      
      case 'DDInputField':
      case 'NumberField':
        return <div key={item.name} className="mb-4">{label}<input type="text" placeholder={item.props.placeholder} disabled={item.props.disabled} value={formData[item.name!] ?? ''} onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} className={`w-full px-3 py-2 border border-gray-200 rounded-lg outline-none transition text-sm ${item.props.disabled ? 'bg-gray-50 text-gray-400' : 'bg-white'}`} /></div>;
      
      case 'DDTextAreaField':
        return (
          <div key={item.name} className="mb-4">
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
                  <span>AI文案优化</span>
                </button>
              )}
            </div>
            <textarea 
              rows={item.props.rows} 
              placeholder={item.props.placeholder}
              value={formData[item.name!] || ''} 
              onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition text-sm" 
            />
            {item.name === 'case_description' && aiFeedback && (
              <div className="mt-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-start mb-2">
                   <p className="text-[10px] font-black text-blue-600 uppercase flex items-center">
                     <SparklesIcon className="w-3 h-3 mr-1" /> 优化建议
                   </p>
                   <button type="button" onClick={() => setAiFeedback(null)} className="text-[10px] font-black text-gray-400 hover:text-gray-600">关闭</button>
                </div>
                <div className="text-[11px] text-gray-700 space-y-2 leading-relaxed whitespace-pre-wrap">
                  {aiFeedback.feedback_points}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-black text-blue-600">预览优化版本</p>
                    <button type="button" onClick={applyAiSuggestion} className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700">采用</button>
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg text-[11px] text-gray-500 italic border border-blue-50">
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
        return <div key={item.name} className="mb-4">{label}<select value={formData[item.name!] || ''} onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-50 transition text-sm"><option value="">请选择{item.label}</option>{opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
      
      case 'DDDateField':
        return <div key={item.name} className="mb-4">{label}<input type="date" value={formData[item.name!] || ''} onChange={(e) => setFormData({...formData, [item.name!]: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-50 transition text-sm" /></div>;

      case 'DDRadioField':
        return <div key={item.name} className="mb-4">{label}<div className="flex flex-wrap gap-2 mt-1">{item.props.options?.map(o => <label key={o.value} className={`flex items-center space-x-2 px-3 py-1.5 border rounded-lg cursor-pointer transition text-xs font-bold ${formData[item.name!] === o.value ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}><input type="radio" className="hidden" checked={formData[item.name!] === o.value} onChange={() => setFormData({...formData, [item.name!]: o.value})} /> <span>{o.label}</span></label>)}</div></div>;

      case 'BehaviorSelector':
        const dim = formData.value_dimension;
        const level = formData.behavior_level;
        const matchedOptions = (dim && level) ? BEHAVIOR_MAPPING[dim]?.[level] : null;

        return (
          <div key={item.name} className="mb-4">
            {label}
            {!dim || !level ? (
              <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl text-center">
                <p className="text-[11px] text-gray-400 font-bold">请先选择“价值观维度”和“行为层级”</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedOptions?.map((optStr, idx) => (
                  <label 
                    key={idx} 
                    className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.behavior_items === optStr 
                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-50' 
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input 
                      type="radio" 
                      className="mt-1"
                      checked={formData.behavior_items === optStr} 
                      onChange={() => setFormData({...formData, behavior_items: optStr})} 
                    />
                    <div className="ml-2">
                      <div className={`text-[11px] font-black transition-colors ${formData.behavior_items === optStr ? 'text-blue-700' : 'text-gray-800'}`}>
                        {optStr.split('（')[0]}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
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
          <div key={item.name} className="mb-4">
            {label}
            <div className="flex flex-wrap gap-2">
              {formData.evidence_files?.map((name: string, i: number) => (
                <div key={i} className="relative group w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-1">
                   <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm mb-1">
                      <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   </div>
                   <span className="text-[8px] text-gray-400 font-bold truncate w-full text-center px-1">{name}</span>
                   <button type="button" onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
              <label className="w-20 h-20 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition">
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-[8px] font-black text-blue-500 uppercase mt-1">上传</span>
              </label>
            </div>
          </div>
        );

      case 'NoteField':
        return <div key={item.name} className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100"><h5 className="text-[11px] font-black text-amber-700 mb-2 flex items-center"><AlertCircleIcon className="w-3.5 h-3.5 mr-1.5" /> 填写须知</h5><div className="text-[11px] text-amber-600/80 leading-relaxed whitespace-pre-wrap font-medium">{item.props.text}</div></div>;

      default: return null;
    }
  };

  const MyHistory = () => {
    const myApps = applications.filter(a => a.applicantId === currentUser?.id);
    return (
      <div className="space-y-4 animate-in fade-in duration-500 pb-10">
        <div className="mb-4">
          <h2 className="text-xl font-black text-gray-900">申报记录</h2>
          <p className="text-xs text-gray-400">实时跟踪您的积分申请进度</p>
        </div>
        {myApps.length === 0 ? (
          <div className="bg-white p-16 rounded-xl text-center border border-gray-100 border-dashed">
            <p className="text-gray-400 text-sm font-bold">暂无申报记录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myApps.map(app => (
              <div key={app.id} className="bg-white rounded-xl p-5 border border-gray-100 relative group">
                 <div className={`absolute top-4 right-4 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded ${
                   app.status === 'approved' ? 'bg-green-100 text-green-700' : 
                   app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                 }`}>
                   {app.status === 'approved' ? '已通过' : app.status === 'rejected' ? '已驳回' : '审核中'}
                 </div>
                 <div className="mb-3 pr-12">
                   <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-50 px-1.5 py-0.5 rounded mr-2">{app.dimension}</span>
                   <h4 className="inline-block text-sm font-black text-gray-900">{app.title}</h4>
                 </div>
                 <p className="text-[11px] text-gray-500 line-clamp-2 mb-4 leading-relaxed italic">"{app.description}"</p>
                 
                 {app.status === 'rejected' && (
                   <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                     <p className="text-[9px] font-black text-red-600 uppercase mb-1">审批反馈：</p>
                     <p className="text-[11px] text-red-800 font-bold">{app.adminOpinion || "暂无备注"}</p>
                     <button 
                       onClick={() => handleResubmit(app)}
                       className="mt-2 w-full py-2 bg-red-600 text-white rounded-lg text-[10px] font-black hover:bg-red-700 transition"
                     >
                       重新修改提交
                     </button>
                   </div>
                 )}
                 
                 <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-auto">
                    <span className="text-[10px] font-mono text-gray-300">{app.submitTime}</span>
                    <span className="text-base font-black text-blue-600">+{app.requestedScore} 分</span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
             <img src={FORM_JSON.icon} className="w-7 h-7 invert" />
          </div>
          <h1 className="text-xl font-black text-gray-900">文化积分门户</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Internal Access Only</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Staff ID</label>
            <input 
              type="text" 
              value={loginId} 
              onChange={(e)=>setLoginId(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold focus:ring-2 focus:ring-blue-50 transition text-sm" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
            <input 
              type="password" 
              value={loginPassword} 
              onChange={(e)=>setLoginPassword(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold focus:ring-2 focus:ring-blue-50 transition text-sm" 
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-[0.98] text-sm">授权并进入</button>
          {loginError && <p className="text-red-500 text-[11px] font-bold text-center mt-2">{loginError}</p>}
        </form>
        <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-widest text-center">2026 青岛谷雅向尚数字科技有限公司 版权所有。</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm"><img src={FORM_JSON.icon} className="w-5 h-5 invert" /></div>
           <div>
             <h1 className="text-sm font-black text-gray-900 leading-none">文化价值观积分系统</h1>
             <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-widest font-bold">Committee Portal</p>
           </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="hidden sm:block text-right border-r pr-4 border-gray-100">
             <p className="text-[11px] font-black text-gray-800 leading-none">{currentUser?.name}</p>
             <p className="text-[10px] font-bold text-blue-600 mt-1">当前分值: {currentUser?.score}</p>
           </div>
           <button onClick={handleLogout} className="text-[10px] font-black text-gray-300 hover:text-red-500 transition uppercase tracking-widest">Logout</button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 py-8 gap-8">
        {/* 左侧导航 - 桌面端显示 */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-2">
          <nav className="space-y-1">
            <button onClick={()=>navigateTo('#/form')} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-black transition ${currentPath==='#/form'?'bg-blue-600 text-white shadow-md shadow-blue-100':'text-gray-500 hover:bg-white'}`}>
              <span className="mr-3">📋</span> 积分申报
            </button>
            {currentUser?.role !== 'employee' ? (
              <button onClick={()=>navigateTo('#/admin')} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-black transition ${currentPath==='#/admin'?'bg-blue-600 text-white shadow-md shadow-blue-100':'text-gray-500 hover:bg-white'}`}>
                <span className="mr-3">🛡️</span> 管理后台
              </button>
            ) : (
              <button onClick={()=>navigateTo('#/history')} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-black transition ${currentPath==='#/history'?'bg-white text-blue-600 shadow-md shadow-blue-100':'text-gray-500 hover:bg-white'}`}>
                <span className="mr-3">🕒</span> 申报记录
              </button>
            )}
          </nav>
        </aside>

        {/* 移动端导航 */}
        <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-gray-100 z-50 flex items-center space-x-2">
          <button onClick={()=>navigateTo('#/form')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${currentPath==='#/form'?'bg-blue-600 text-white':'text-gray-400'}`}>申报</button>
          {currentUser?.role !== 'employee' ? (
            <button onClick={()=>navigateTo('#/admin')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${currentPath==='#/admin'?'bg-blue-600 text-white':'text-gray-400'}`}>管理</button>
          ) : (
            <button onClick={()=>navigateTo('#/history')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition ${currentPath==='#/history'?'bg-blue-600 text-white':'text-gray-400'}`}>记录</button>
          )}
        </nav>

        <main className="flex-1 overflow-hidden">
          {currentPath === '#/form' ? (
            isSuccess ? (
              <div className="bg-white p-16 rounded-2xl text-center shadow-sm border border-gray-100 animate-in zoom-in-95 max-w-2xl mx-auto">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-gray-900 mb-2">提交成功</h2>
                <p className="text-gray-400 text-sm mb-10">您的积分申报已进入后台审核流，通过后将同步发放。</p>
                <button onClick={resetForm} className="px-12 py-3.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-100 transition">完成并返回</button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="bg-blue-50/50 p-5 rounded-xl text-blue-800 text-[11px] font-bold border border-blue-100/50 mb-8 leading-relaxed">
                    💡 {FORM_JSON.description}
                  </div>
                  <form onSubmit={handleSubmit}>
                    {FORM_JSON.items.map(renderField)}
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-center sm:text-left">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">本次申报积分汇总</p>
                        <p className="text-4xl font-black text-blue-600">+{formData.total_score} <span className="text-xs text-blue-400">Score</span></p>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-16 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 text-sm">
                        {isSubmitting ? '正在安全传输...' : '确 认 提 交'}
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* 桌面端侧边提示栏 */}
                <div className="hidden xl:block w-72 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-black text-gray-900 mb-4 uppercase tracking-widest">价值观评分标准</h4>
                    <ul className="space-y-3">
                      <li className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-gray-500">L2 进阶级别</span>
                        <span className="text-blue-600">5 分</span>
                      </li>
                      <li className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-gray-500">L3 卓越级别</span>
                        <span className="text-blue-600">10 分</span>
                      </li>
                    </ul>
                    <div className="mt-6 pt-4 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 leading-relaxed italic">"真实的行为描述与确凿的证据链是积分审批的关键要素。"</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : currentPath === '#/history' ? (
            <MyHistory />
          ) : (
            <AdminPanel currentUserRole={currentUser?.role || 'employee'} staffRecords={localStaffRecords} applications={applications} onUpdateStaff={setLocalStaffRecords} onUpdateApplications={setApplications} />
          )}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2026 青岛谷雅向尚数字科技有限公司 版权所有。</p>
           <div className="flex space-x-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">
             <a href="#" className="hover:text-blue-500 transition">Privacy Policy</a>
             <a href="#" className="hover:text-blue-500 transition">Score Guidelines</a>
             <a href="#" className="hover:text-blue-500 transition">Support</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
