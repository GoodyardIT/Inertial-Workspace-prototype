
import React, { useState, useMemo } from 'react';
import { StaffRecord, UserRole, ApplicationRequest, PointHistoryEntry } from './types';

interface AdminPanelProps {
  currentUserRole: UserRole;
  staffRecords: StaffRecord[];
  applications: ApplicationRequest[];
  onUpdateStaff: (updatedStaff: StaffRecord[]) => void;
  onUpdateApplications: (updatedApps: ApplicationRequest[]) => void;
}

type AdminSubView = 'staff' | 'approval';
type SortOrder = 'desc' | 'asc' | null;

const PAGE_SIZE = 50;

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  currentUserRole, 
  staffRecords, 
  applications, 
  onUpdateStaff, 
  onUpdateApplications 
}) => {
  const [subView, setSubView] = useState<AdminSubView>('approval');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [opinions, setOpinions] = useState<{ [key: string]: string }>({});
  
  // 筛选与排序状态
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [scoreSort, setScoreSort] = useState<SortOrder>('desc');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 新增成员表单状态
  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    employeeId: '',
    role: 'employee' as UserRole,
    joinDate: new Date().toISOString().split('T')[0],
  });
  const [addError, setAddError] = useState('');

  // 综合过滤、排序逻辑
  const filteredAndSortedRecords = useMemo(() => {
    let result = staffRecords.filter(record => {
      const matchSearch = record.name.includes(searchTerm) || record.employeeId.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchDate = (!dateStart || record.joinDate >= dateStart) && (!dateEnd || record.joinDate <= dateEnd);
      return matchSearch && matchStatus && matchDate;
    });

    if (scoreSort) {
      result.sort((a, b) => scoreSort === 'desc' ? b.score - a.score : a.score - b.score);
    }

    return result;
  }, [staffRecords, searchTerm, statusFilter, scoreSort, dateStart, dateEnd]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredAndSortedRecords.length / PAGE_SIZE);
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedRecords.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedRecords, currentPage]);

  const pendingApps = applications.filter(app => app.status === 'pending');

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUserRole !== 'super_admin') return;
    const updated = staffRecords.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r);
    onUpdateStaff(updated);
  };

  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.employeeId || !newMember.joinDate) {
      setAddError('请填写完整信息');
      return;
    }
    if (staffRecords.some(r => r.employeeId.toUpperCase() === newMember.employeeId.toUpperCase())) {
      setAddError('工号已存在');
      return;
    }

    const record: StaffRecord = {
      id: `staff-${Date.now()}`,
      name: newMember.name,
      employeeId: newMember.employeeId.toUpperCase(),
      role: newMember.role,
      joinDate: newMember.joinDate,
      score: 0,
      status: 'active',
      history: []
    };

    onUpdateStaff([...staffRecords, record]);
    setIsAdding(false);
    setNewMember({ name: '', employeeId: '', role: 'employee', joinDate: new Date().toISOString().split('T')[0] });
    setAddError('');
  };

  const handleApprove = (app: ApplicationRequest, isApproved: boolean) => {
    const opinion = opinions[app.id] || (isApproved ? '核实无误，予以通过。' : '信息不全或不符合要求。');
    
    const updatedApps = applications.map(a => 
      a.id === app.id ? { ...a, status: isApproved ? 'approved' : 'rejected' as any, adminOpinion: opinion } : a
    );
    onUpdateApplications(updatedApps);

    if (isApproved) {
      const updatedStaff = staffRecords.map(s => {
        if (s.id === app.applicantId) {
          const newEntry: PointHistoryEntry = {
            id: `h-auto-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: `[审批通过] ${app.title}`,
            dimension: app.dimension,
            amount: app.requestedScore,
            status: 'approved',
            opinion: opinion
          };
          return {
            ...s,
            score: s.score + app.requestedScore,
            history: [newEntry, ...(s.history || [])]
          };
        }
        return s;
      });
      onUpdateStaff(updatedStaff);
    }
    
    const newOpinions = { ...opinions };
    delete newOpinions[app.id];
    setOpinions(newOpinions);
  };

  const selectedStaff = staffRecords.find(r => r.id === selectedStaffId);

  const ApprovalFlow = ({ app }: { app: ApplicationRequest }) => (
    <div className="flex flex-col space-y-0 relative pl-4 mt-4 border-l border-gray-100">
      <div className="relative pb-6">
        <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
           <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
        </div>
        <div className="flex items-center justify-between">
           <span className="text-[11px] font-black text-gray-900">发起申请</span>
           <span className="text-[10px] text-gray-400 font-mono">{app.submitTime.split(' ')[0]}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">申请人：{app.applicantName}</p>
      </div>
      <div className="relative pb-6">
        <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white animate-pulse"></div>
        <div className="flex items-center justify-between">
           <span className="text-[11px] font-black text-blue-600">管理员审批 (会签)</span>
           <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">处理中</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">当前节点：人力资源部/价值观委员会</p>
      </div>
      <div className="relative">
        <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
        <div className="flex items-center justify-between">
           <span className="text-[11px] font-black text-gray-300">积分发放</span>
        </div>
        <p className="text-[10px] text-gray-300 mt-0.5">待审批完成后自动执行</p>
      </div>
    </div>
  );

  if (selectedStaff) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-gray-50 animate-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setSelectedStaffId(null)} className="flex items-center text-gray-400 hover:text-blue-600 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-blue-50 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </div>
            <span className="text-sm font-black uppercase tracking-widest">返回列表</span>
          </button>
        </div>
        <div className="bg-gray-900 rounded-3xl p-8 text-white mb-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between">
            <div className="mb-6 sm:mb-0 text-center sm:text-left">
              <h2 className="text-3xl font-black mb-1">{selectedStaff.name}</h2>
              <p className="text-blue-400 font-mono text-sm tracking-widest uppercase">ID: {selectedStaff.employeeId} | 入职: {selectedStaff.joinDate}</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">当前累计积分</p>
              <p className="text-5xl font-black tabular-nums">{selectedStaff.score}</p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-widest border-b border-gray-100 pb-3">积分历史详情</h3>
          <div className="space-y-4">
            {selectedStaff.history?.map((entry) => (
              <div key={entry.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mr-3 px-2 py-0.5 bg-blue-50 rounded">{entry.dimension}</span>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">{entry.date}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 leading-snug">{entry.description}</p>
                    {entry.opinion && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl border-l-2 border-gray-200">
                         <p className="text-[10px] font-black text-gray-400 uppercase mb-1">审批意见</p>
                         <p className="text-xs text-gray-600 italic">"{entry.opinion}"</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span className={`text-xl font-black tabular-nums ${entry.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>+{entry.amount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => { setSubView('approval'); setIsAdding(false); }}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center ${subView === 'approval' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
        >
          审批中心
          {pendingApps.length > 0 && <span className="ml-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]">{pendingApps.length}</span>}
        </button>
        <button 
          onClick={() => setSubView('staff')}
          className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${subView === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
        >
          成员管理
        </button>
      </div>

      {subView === 'approval' ? (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-black text-gray-900">待办审批</h2>
            <p className="text-xs text-gray-400 font-medium">请核对案例事实，填写审批意见并决定是否通过</p>
          </div>
          
          {pendingApps.length === 0 && (
            <div className="bg-white p-20 rounded-[2.5rem] border border-gray-50 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-gray-400 font-bold">暂无待处理的积分申请</p>
            </div>
          )}

          {pendingApps.map(app => (
            <div key={app.id} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 border-r border-gray-50 pr-0 lg:pr-8">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100">{app.applicantName.charAt(0)}</div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 leading-tight">{app.applicantName}</h4>
                        <p className="text-xs text-gray-400 font-bold mt-1">工号：{staffRecords.find(s => s.id === app.applicantId)?.employeeId}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50/30 p-5 rounded-3xl border border-blue-100 mb-6">
                       <div className="flex items-center mb-3">
                         <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase mr-2 tracking-widest">{app.dimension}</span>
                         <h5 className="font-black text-gray-800">{app.title}</h5>
                       </div>
                       <p className="text-sm text-gray-600 leading-relaxed italic">"{app.description}"</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-50">
                       <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">审批流程详情</h6>
                       <ApprovalFlow app={app} />
                    </div>
                  </div>
                  <div className="w-full lg:w-[320px] flex flex-col justify-between">
                    <div>
                       <div className="bg-gray-50 p-6 rounded-3xl text-center mb-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">申请积分</p>
                          <p className="text-5xl font-black text-blue-600 tabular-nums">+{app.requestedScore}</p>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">审批意见/反馈</label>
                          <textarea 
                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none h-32"
                            placeholder="请输入审批意见"
                            value={opinions[app.id] || ''}
                            onChange={(e) => setOpinions({ ...opinions, [app.id]: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="flex space-x-3 mt-8">
                       <button onClick={() => handleApprove(app, true)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition">通过申请</button>
                       <button onClick={() => handleApprove(app, false)} className="px-6 py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-black text-sm hover:bg-red-50 transition">拒绝</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-gray-50">
          {/* 筛选与搜索工具栏 */}
          <div className="flex flex-col space-y-4 mb-8">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">关键词搜索</label>
                <input
                  type="text"
                  placeholder="姓名或工号..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-6 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-medium"
                />
              </div>
              <div className="w-[120px]">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">状态筛选</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-sm"
                >
                  <option value="all">全部状态</option>
                  <option value="active">正常</option>
                  <option value="inactive">冻结</option>
                </select>
              </div>
              <div className="flex-1 min-w-[300px]">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block ml-1">入职日期区间</label>
                <div className="flex items-center space-x-2">
                  <input type="date" value={dateStart} onChange={(e) => { setDateStart(e.target.value); setCurrentPage(1); }} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                  <span className="text-gray-300">至</span>
                  <input type="date" value={dateEnd} onChange={(e) => { setDateEnd(e.target.value); setCurrentPage(1); }} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-50 outline-none transition-all" />
                </div>
              </div>
              {currentUserRole === 'super_admin' && !isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                >
                  新增成员
                </button>
              )}
            </div>
          </div>

          {isAdding && (
            <div className="mb-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in zoom-in-95 duration-300">
              <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-widest">添加新成员</h3>
              <form onSubmit={handleSaveNewMember} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">姓名</label>
                  <input 
                    type="text" 
                    value={newMember.name} 
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-50 transition font-bold" 
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">工号</label>
                  <input 
                    type="text" 
                    value={newMember.employeeId} 
                    onChange={(e) => setNewMember({...newMember, employeeId: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-50 transition uppercase font-bold" 
                    placeholder="如: DT006"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">入职日期</label>
                  <input 
                    type="date" 
                    value={newMember.joinDate} 
                    onChange={(e) => setNewMember({...newMember, joinDate: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-50 transition font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">角色权限</label>
                  <select 
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value as UserRole})}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-50 transition font-bold"
                  >
                    <option value="employee">普通员工</option>
                    <option value="admin">管理员</option>
                    <option value="super_admin">超级管理员</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between mt-2">
                  <span className="text-red-500 text-[10px] font-bold">{addError}</span>
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50">取消</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700">确认添加</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">姓名</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">入职日期</th>
                  <th 
                    className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setScoreSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                  >
                    累计积分 {scoreSort === 'desc' ? '↓' : '↑'}
                  </th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">账号状态</th>
                  {currentUserRole === 'super_admin' && <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作项</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedRecords.map((record) => (
                  <tr key={record.id} onClick={() => setSelectedStaffId(record.id)} className="hover:bg-blue-50/50 transition-colors cursor-pointer group">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">{record.name.charAt(0)}</div>
                        <div>
                          <span className="font-bold text-gray-800 block leading-none mb-1">{record.name}</span>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{record.role} | {record.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs font-mono text-gray-500">{record.joinDate}</td>
                    <td className="py-4 px-4 text-center"><span className="text-lg font-black text-blue-600 tabular-nums">{record.score}</span></td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${record.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {record.status === 'active' ? '正常' : '冻结'}
                      </span>
                    </td>
                    {currentUserRole === 'super_admin' && (
                      <td className="py-4 px-4 text-right">
                        <button onClick={(e) => handleToggleStatus(record.id, e)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all ${record.status === 'active' ? 'bg-gray-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}>
                          {record.status === 'active' ? '冻结' : '恢复'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页控制器 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-30"
              >
                上一页
              </button>
              <span className="text-xs font-black text-gray-400 uppercase px-4">第 {currentPage} / {totalPages} 页</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-30"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
