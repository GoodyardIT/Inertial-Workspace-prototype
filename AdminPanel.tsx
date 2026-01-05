
import React, { useState, useMemo } from 'react';
import { StaffRecord, UserRole, ApplicationRequest, PointHistoryEntry } from './types';

interface AdminPanelProps {
  currentUserRole: UserRole;
  staffRecords: StaffRecord[];
  applications: ApplicationRequest[];
  onUpdateStaff: (updatedStaff: StaffRecord[]) => void;
  onUpdateApplications: (updatedApps: ApplicationRequest[]) => void;
}

type AdminSubView = 'staff' | 'approval' | 'analysis';
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
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [scoreSort, setScoreSort] = useState<SortOrder>('desc');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isAdding, setIsAdding] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    employeeId: '',
    role: 'employee' as UserRole,
    joinDate: new Date().toISOString().split('T')[0],
  });
  const [addError, setAddError] = useState('');

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

  const totalPages = Math.ceil(filteredAndSortedRecords.length / PAGE_SIZE);
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedRecords.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedRecords, currentPage]);

  const pendingApps = applications.filter(app => app.status === 'pending');

  // 数据分析逻辑
  const analysisStats = useMemo(() => {
    const totalApps = applications.length;
    const approvedApps = applications.filter(a => a.status === 'approved').length;
    const dimensionCounts: Record<string, number> = {};
    
    applications.forEach(app => {
      dimensionCounts[app.dimension] = (dimensionCounts[app.dimension] || 0) + 1;
    });

    const topScores = [...staffRecords].sort((a, b) => b.score - a.score).slice(0, 5);
    const topLogins = [...staffRecords].sort((a, b) => b.loginCount - a.loginCount).slice(0, 5);

    return { totalApps, approvedApps, dimensionCounts, topScores, topLogins };
  }, [applications, staffRecords]);

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
    const empId = newMember.employeeId.toUpperCase();
    if (staffRecords.some(r => r.employeeId.toUpperCase() === empId)) {
      setAddError('工号已存在');
      return;
    }
    const record: StaffRecord = {
      id: `staff-${Date.now()}`,
      name: newMember.name,
      employeeId: empId,
      password: `${empId}@GY`,
      role: newMember.role,
      joinDate: newMember.joinDate,
      score: 0,
      loginCount: 0,
      status: 'active',
      history: []
    };
    onUpdateStaff([...staffRecords, record]);
    setIsAdding(false);
    setNewMember({ name: '', employeeId: '', role: 'employee', joinDate: new Date().toISOString().split('T')[0] });
    setAddError('');
  };

  const handleApprove = (app: ApplicationRequest, isApproved: boolean) => {
    const opinion = opinions[app.id] || (isApproved ? '核实无误，予以通过。' : '不符合要求。');
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
          return { ...s, score: s.score + app.requestedScore, history: [newEntry, ...(s.history || [])] };
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
    <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-tighter">
      <div className="flex items-center text-green-500">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1"></div> 发起
      </div>
      <div className="w-4 h-px bg-gray-200"></div>
      <div className="flex items-center text-blue-500">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1 animate-pulse"></div> 审核中
      </div>
      <div className="w-4 h-px bg-gray-200"></div>
      <div className="flex items-center text-gray-300">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mr-1"></div> 发放
      </div>
    </div>
  );

  if (selectedStaff) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-4 duration-300">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
          <button onClick={() => setSelectedStaffId(null)} className="flex items-center text-xs font-black text-gray-400 hover:text-blue-600 transition">
             <span className="mr-2">←</span> 员工列表
          </button>
          <div className="text-right">
             <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedStaff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               Account {selectedStaff.status}
             </span>
          </div>
        </div>
        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <div className="flex-1 flex items-start space-x-6">
               <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-100">{selectedStaff.name.charAt(0)}</div>
               <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedStaff.name}</h2>
                  <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedStaff.role} | {selectedStaff.employeeId}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <p className="text-[10px] text-gray-400">入职: {selectedStaff.joinDate}</p>
                    <p className="text-[10px] text-blue-500 font-black">登录次数: {selectedStaff.loginCount}</p>
                  </div>
               </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-6 text-white min-w-[200px] text-center">
               <p className="text-[10px] font-black opacity-40 uppercase mb-1">Total Score</p>
               <p className="text-4xl font-black tabular-nums">{selectedStaff.score}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">积分变动明细</h3>
            {selectedStaff.history?.length === 0 ? (
              <p className="text-center py-10 text-xs text-gray-300 font-bold">暂无历史记录</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {selectedStaff.history?.map((entry) => (
                  <div key={entry.id} className="py-4 flex justify-between items-start group">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{entry.dimension}</span>
                        <span className="text-[10px] font-mono text-gray-300">{entry.date}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-700">{entry.description}</p>
                      {entry.opinion && <p className="text-[11px] text-gray-400 italic mt-1 leading-relaxed">"{entry.opinion}"</p>}
                    </div>
                    <div className="text-right">
                       <span className="text-base font-black text-blue-600 tabular-nums">+{entry.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 顶栏控制 */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 inline-flex shadow-sm">
        <button 
          onClick={() => { setSubView('approval'); setIsAdding(false); }}
          className={`px-6 py-2 rounded-lg text-xs font-black transition ${subView === 'approval' ? 'bg-blue-600 text-white shadow-md shadow-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          审批中心 ({pendingApps.length})
        </button>
        <button 
          onClick={() => setSubView('staff')}
          className={`px-6 py-2 rounded-lg text-xs font-black transition ${subView === 'staff' ? 'bg-blue-600 text-white shadow-md shadow-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          成员档案
        </button>
        <button 
          onClick={() => setSubView('analysis')}
          className={`px-6 py-2 rounded-lg text-xs font-black transition ${subView === 'analysis' ? 'bg-blue-600 text-white shadow-md shadow-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          数据分析
        </button>
      </div>

      {subView === 'approval' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black text-gray-900">待办审批项</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Pending Requests Queue</p>
            </div>
          </div>
          {pendingApps.length === 0 ? (
            <div className="bg-white py-24 rounded-2xl border border-gray-100 border-dashed text-center">
              <p className="text-gray-300 text-sm font-black uppercase tracking-widest">所有申请已处理完毕</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {pendingApps.map(app => (
                <div key={app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black">{app.applicantName.charAt(0)}</div>
                         <div>
                            <p className="text-sm font-black text-gray-900">{app.applicantName}</p>
                            <p className="text-[10px] font-bold text-gray-400">{app.submitTime}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Points Applied</p>
                         <p className="text-2xl font-black text-blue-600">+{app.requestedScore}</p>
                       </div>
                    </div>
                    <div className="mb-6">
                       <div className="flex items-center mb-2">
                         <span className="text-[9px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded mr-2 tracking-widest uppercase">{app.dimension}</span>
                         <h4 className="text-sm font-black text-gray-800">{app.title}</h4>
                       </div>
                       <p className="text-[11px] text-gray-500 leading-relaxed italic bg-gray-50 p-3 rounded-lg">"{app.description}"</p>
                    </div>
                    <ApprovalFlow app={app} />
                  </div>
                  <div className="bg-gray-50 border-t border-gray-100 p-6 flex flex-col gap-4">
                    <textarea 
                      className="w-full bg-white border border-gray-200 rounded-lg p-3 text-[11px] outline-none focus:ring-2 focus:ring-blue-100 transition resize-none h-16"
                      placeholder="输入审批意见（非必填，拒绝时建议填写）"
                      value={opinions[app.id] || ''}
                      onChange={(e) => setOpinions({ ...opinions, [app.id]: e.target.value })}
                    />
                    <div className="flex space-x-3">
                      <button onClick={() => handleApprove(app, true)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition">Approve</button>
                      <button onClick={() => handleApprove(app, false)} className="px-6 py-2.5 bg-white border border-red-100 text-red-500 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : subView === 'staff' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-6 bg-gray-50/50 border-b border-gray-50 flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px]">
                <input
                  type="text"
                  placeholder="搜索姓名或工号..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none text-xs font-bold"
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg outline-none text-xs font-bold"
              >
                <option value="all">所有状态</option>
                <option value="active">正常在职</option>
                <option value="inactive">账户冻结</option>
              </select>
            </div>
            {currentUserRole === 'super_admin' && (
              <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                {isAdding ? '取消添加' : '新增员工'}
              </button>
            )}
          </div>
          {isAdding && (
            <div className="p-6 bg-blue-50/30 border-b border-blue-50">
              <form onSubmit={handleSaveNewMember} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" value={newMember.name} onChange={(e)=>setNewMember({...newMember, name:e.target.value})} placeholder="姓名" className="px-4 py-2 bg-white border rounded-lg text-xs font-bold outline-none" />
                <input type="text" value={newMember.employeeId} onChange={(e)=>setNewMember({...newMember, employeeId:e.target.value})} placeholder="工号" className="px-4 py-2 bg-white border rounded-lg text-xs font-bold outline-none uppercase" />
                <input type="date" value={newMember.joinDate} onChange={(e)=>setNewMember({...newMember, joinDate:e.target.value})} className="px-4 py-2 bg-white border rounded-lg text-xs font-bold outline-none" />
                <div className="flex items-center space-x-2">
                  <select value={newMember.role} onChange={(e)=>setNewMember({...newMember, role:e.target.value as UserRole})} className="flex-1 px-4 py-2 bg-white border rounded-lg text-xs font-bold outline-none">
                    <option value="employee">普通员工</option>
                    <option value="admin">管理员</option>
                    <option value="super_admin">超级管理员</option>
                  </select>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">确认</button>
                </div>
              </form>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Join Date</th>
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Logins</th>
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-blue-600" onClick={() => setScoreSort(prev => prev === 'desc' ? 'asc' : 'desc')}>
                    Points {scoreSort === 'desc' ? '↓' : '↑'}
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedRecords.map((record) => (
                  <tr key={record.id} onClick={() => setSelectedStaffId(record.id)} className="hover:bg-blue-50/20 transition-colors cursor-pointer group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">{record.name.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-black text-gray-900">{record.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{record.role} | {record.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[10px] font-mono font-bold text-gray-400">{record.joinDate}</td>
                    <td className="py-4 px-6 text-center text-xs font-bold text-gray-500 tabular-nums">{record.loginCount}</td>
                    <td className="py-4 px-6 text-center text-sm font-black text-blue-600 tabular-nums">{record.score}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${record.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">总申请数</p>
                <p className="text-3xl font-black text-gray-900">{analysisStats.totalApps}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">已通过案例</p>
                <p className="text-3xl font-black text-green-600">{analysisStats.approvedApps}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">申请通过率</p>
                <p className="text-3xl font-black text-blue-600">
                  {analysisStats.totalApps ? Math.round((analysisStats.approvedApps / analysisStats.totalApps) * 100) : 0}%
                </p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 价值观分布 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-900 mb-6 uppercase tracking-widest">价值观案例分布</h3>
                 <div className="space-y-4">
                    {Object.entries(analysisStats.dimensionCounts).length === 0 ? (
                      <p className="text-xs text-gray-300 font-bold py-10 text-center">暂无维度数据</p>
                    ) : (
                      // Explicitly cast Object.entries result to [string, number][] to fix arithmetic operation error
                      (Object.entries(analysisStats.dimensionCounts) as [string, number][]).sort((a,b)=>(b[1] as number)-(a[1] as number)).map(([dim, count]) => (
                        <div key={dim} className="space-y-1">
                           <div className="flex justify-between text-[10px] font-black uppercase">
                              <span className="text-gray-500">{dim}</span>
                              <span className="text-blue-600">{count} 案例</span>
                           </div>
                           <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                              {/* Cast count to number to fix arithmetic operation error */}
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${((count as number) / analysisStats.totalApps) * 100}%` }}></div>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              {/* 登录活跃榜 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                 <h3 className="text-xs font-black text-gray-900 mb-6 uppercase tracking-widest">登录活跃榜 (Top 5)</h3>
                 <div className="space-y-4">
                    {analysisStats.topLogins.map((staff, idx) => (
                      <div key={staff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                           <span className="text-xs font-black text-gray-300">#{idx + 1}</span>
                           <span className="text-xs font-bold text-gray-800">{staff.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                           {staff.loginCount} 次访问
                        </span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* 积分排行榜 */}
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                 <h3 className="text-xs font-black text-gray-900 mb-6 uppercase tracking-widest">积分荣誉榜 (Top 5)</h3>
                 <div className="flex flex-wrap gap-4">
                    {analysisStats.topScores.map((staff, idx) => (
                      <div key={staff.id} className="flex-1 min-w-[150px] p-6 border border-gray-50 rounded-2xl text-center hover:border-blue-100 transition">
                         <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-black text-sm">
                            {idx + 1}
                         </div>
                         <p className="text-sm font-black text-gray-800 mb-1">{staff.name}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">{staff.employeeId}</p>
                         <p className="text-xl font-black text-blue-600 tabular-nums">{staff.score} <span className="text-[9px] font-bold">pts</span></p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
