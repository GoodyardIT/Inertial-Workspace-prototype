
import React, { useState, useEffect } from 'react';
import { FORM_JSON, STAFF_LIST, DEPARTMENT_LIST, POSITION_LIST } from './constants';
import { FormItem, FormData } from './types';
import { optimizeCaseDescription } from './geminiService';
import { SparklesIcon, CheckCircleIcon, AlertCircleIcon, LoadingSpinner } from './Icons';

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    apply_date: new Date().toISOString().split('T')[0],
    is_repeat_application: 'no',
    behavior_items: [],
    item_score: "0",
    total_score: 0,
    case_title: '',
    case_description: '',
    value_dimension: '',
  });
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ suggestion: string; score_assessment: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const selectedBehaviorValues = formData.behavior_items || [];
    const checkboxField = FORM_JSON.items.find(item => item.name === 'behavior_items');
    const options = checkboxField?.props?.options || [];
    
    let total = 0;
    selectedBehaviorValues.forEach((val: string) => {
      const opt = options.find(o => o.value === val);
      if (opt?.score) total += opt.score;
    });

    const average = selectedBehaviorValues.length > 0 ? (total / selectedBehaviorValues.length).toFixed(1) : "0";

    setFormData(prev => ({
      ...prev,
      item_score: average,
      total_score: total
    }));
  }, [formData.behavior_items]);

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const current = prev[name] || [];
      if (checked) {
        return { ...prev, [name]: [...current, value] };
      } else {
        return { ...prev, [name]: current.filter((v: string) => v !== value) };
      }
    });
  };

  const handleAiOptimize = async () => {
    if (!formData.case_description || !formData.case_title) {
      alert("请先填写案例标题和描述。");
      return;
    }
    setIsAiLoading(true);
    setAiFeedback(null);
    try {
      const result = await optimizeCaseDescription(
        formData.case_title,
        formData.value_dimension || "通用价值观",
        formData.case_description
      );
      setAiFeedback(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (aiFeedback) {
      setFormData(prev => ({ ...prev, case_description: aiFeedback.suggestion }));
      setAiFeedback(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1000);
  };

  const resetForm = () => {
    setFormData({
      apply_date: new Date().toISOString().split('T')[0],
      is_repeat_application: 'no',
      behavior_items: [],
      item_score: "0",
      total_score: 0,
      case_title: '',
      case_description: '',
      value_dimension: '',
    });
    setAiFeedback(null);
    setIsSuccess(false);
  };

  const renderField = (item: FormItem) => {
    const isHidden = item.name === 'repeat_reason' && formData.is_repeat_application === 'no';
    if (isHidden || item.hidden) return null;

    const label = (
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {item.label} {item.required && <span className="text-red-500">*</span>}
      </label>
    );

    switch (item.componentName) {
      case 'HeaderField':
        return (
          <div key={`h-${item.props.title}`} className="mt-10 mb-6 border-l-4 border-blue-600 pl-4">
            <h3 className="text-lg font-black text-gray-900">{item.props.title}</h3>
            {item.props.description && <p className="text-xs text-gray-400 font-medium mt-1">{item.props.description}</p>}
          </div>
        );

      case 'DDInputField':
      case 'NumberField':
        return (
          <div key={item.name} className="mb-6">
            {label}
            <input
              type={item.componentName === 'NumberField' ? 'text' : 'text'}
              disabled={item.props.disabled}
              value={formData[item.name!] ?? ''}
              onChange={(e) => handleInputChange(item.name!, e.target.value)}
              placeholder={item.props.placeholder}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition ${item.props.disabled ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
              required={item.required}
            />
          </div>
        );

      case 'DDSelectField':
      case 'DepartmentPicker':
        let opts = item.props.options || [];
        if (item.props.dataSource === 'staffList') opts = STAFF_LIST;
        if (item.componentName === 'DepartmentPicker') opts = DEPARTMENT_LIST;
        if (item.props.dataSource === 'positionList') opts = POSITION_LIST;

        return (
          <div key={item.name} className="mb-6">
            {label}
            <select
              value={formData[item.name!] || ''}
              onChange={(e) => handleInputChange(item.name!, e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none focus:ring-4 focus:ring-blue-50"
              required={item.required}
            >
              <option value="">{item.props.placeholder || '请选择'}</option>
              {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        );

      case 'DDDateField':
        return (
          <div key={item.name} className="mb-6">
            {label}
            <input
              type="date"
              value={formData[item.name!] || ''}
              onChange={(e) => handleInputChange(item.name!, e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-50"
              required={item.required}
            />
          </div>
        );

      case 'DDRadioField':
        return (
          <div key={item.name} className="mb-6">
            {label}
            <div className="flex flex-wrap gap-4">
              {item.props.options?.map(o => (
                <label key={o.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name={item.name}
                    value={o.value}
                    checked={formData[item.name!] === o.value}
                    onChange={(e) => handleInputChange(item.name!, e.target.value)}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-600">{o.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'DDCheckboxField':
        return (
          <div key={item.name} className="mb-6">
            {label}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {item.props.options?.map(o => {
                const checked = formData[item.name!]?.includes(o.value);
                return (
                  <label key={o.value} className={`flex items-start p-4 border rounded-2xl cursor-pointer transition ${checked ? 'bg-blue-50 border-blue-400' : 'bg-white hover:border-blue-200'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handleCheckboxChange(item.name!, o.value, e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 rounded"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-bold text-gray-800">{o.label}</span>
                      <span className="block text-[10px] font-black text-blue-500 mt-1">+{o.score} 积分</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'DDTextAreaField':
        return (
          <div key={item.name} className="mb-6">
            <div className="flex justify-between items-center mb-2">
              {label}
              {item.name === 'case_description' && (
                <button
                  type="button"
                  onClick={handleAiOptimize}
                  disabled={isAiLoading}
                  className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-black hover:bg-blue-100 disabled:opacity-50"
                >
                  {isAiLoading ? <LoadingSpinner className="w-3 h-3 mr-1" /> : <SparklesIcon className="w-3 h-3 mr-1" />}
                  AI 润色
                </button>
              )}
            </div>
            <textarea
              rows={item.props.rows || 4}
              value={formData[item.name!] || ''}
              onChange={(e) => handleInputChange(item.name!, e.target.value)}
              placeholder={item.props.placeholder}
              maxLength={item.props.maxLength}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-50 outline-none transition resize-none"
              required={item.required}
            />
          </div>
        );

      case 'DDAttachment':
        return (
          <div key={item.name} className="mb-6">
            {label}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 cursor-pointer transition">
              <div className="mb-2 flex justify-center text-gray-400">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-sm font-bold text-blue-600">上传附件证据</span>
              <p className="text-[10px] text-gray-400 mt-1">支持 {item.props.fileTypes?.join('/')} · 最大 {item.props.maxSize}MB</p>
            </div>
          </div>
        );

      case 'NoteField':
        return (
          <div key="note" className="bg-amber-50 p-5 rounded-2xl border border-amber-100 mb-8">
            <div className="flex space-x-3">
              <AlertCircleIcon className="text-amber-500 w-6 h-6 flex-shrink-0" />
              <div className="text-xs text-amber-900 leading-relaxed font-medium">
                <h4 className="font-black mb-1">注意事项</h4>
                {item.props.text}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white/80 backdrop-blur sticky top-0 z-50 border-b border-gray-100 px-6 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <img src={FORM_JSON.icon} alt="OA" className="w-6 h-6 invert" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">{FORM_JSON.title}</h1>
              <p className="text-[10px] text-blue-500 font-bold tracking-widest uppercase">Cultural Management Portal</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-8 px-6">
        {isSuccess ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-xl text-center border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">提交成功</h2>
            <p className="text-gray-500 mb-8 font-medium">申请已进入审批流程。预估积分：<span className="text-blue-600 font-black">{formData.total_score}</span></p>
            <button onClick={resetForm} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100">返回重填</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-gray-50">
            <div className="bg-blue-600 p-6 rounded-3xl text-white mb-8 shadow-xl shadow-blue-100">
              <p className="text-sm font-bold leading-relaxed">{FORM_JSON.description}</p>
            </div>

            {FORM_JSON.items.map(renderField)}

            {/* AI Result Card */}
            {aiFeedback && (
              <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  <SparklesIcon className="text-blue-500 mr-2" />
                  <h4 className="text-sm font-black text-blue-900">AI 润色结果 (STAR)</h4>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 text-sm text-gray-700 leading-relaxed font-medium mb-4 italic">
                  "{aiFeedback.suggestion}"
                </div>
                <div className="flex space-x-2">
                  <button type="button" onClick={applyAiSuggestion} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black">采用建议</button>
                  <button type="button" onClick={() => setAiFeedback(null)} className="flex-1 py-3 bg-white border border-blue-100 text-blue-600 rounded-xl text-xs font-black">忽略</button>
                </div>
              </div>
            )}

            <div className="mt-12 bg-gray-900 p-6 rounded-3xl text-white flex justify-between items-center shadow-2xl">
              <div>
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">本次预估总积分</p>
                <p className="text-4xl font-black tabular-nums">{formData.total_score}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">平均系数</p>
                <p className="text-xl font-black text-blue-400">{formData.item_score}</p>
              </div>
            </div>

            <div className="mt-12 flex space-x-4 border-t border-gray-50 pt-10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? <LoadingSpinner className="mr-3" /> : null}
                提交申请
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="w-24 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-gray-100 transition"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default App;
