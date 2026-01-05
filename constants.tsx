
import { FormTemplate, StaffRecord } from './types';

// 根据 CSV 附件整理的行为映射表
export const BEHAVIOR_MAPPING: Record<string, Record<string, string[]>> = {
  "customer_first": {
    "L2": [
      "个性化解决方案（关键词：主动了解、个性化方案、预防性建议）",
      "投诉处理与转化（关键词：复杂投诉、书面认可、客诉转化）"
    ],
    "L3": [
      "需求洞察与改进（关键词：需求报告、推动改进、战略合作）",
      "客户代言与引荐（关键词：客户代言、主动引荐、口碑传播）"
    ]
  },
  "teamwork": {
    "L2": [
      "主动补位与支持（关键词：主动承担、经验分享、协助同事）",
      "冲突调解与共识（关键词：调解摩擦、促成共识、团队和谐）"
    ],
    "L3": [
      "协作机制创新（关键词：建立机制、提升效率、跨团队协作）",
      "关键纽带作用（关键词：复杂项目、关键纽带、突破进展）"
    ]
  },
  "innovation": {
    "L2": [
      "知识贡献与复用（关键词：知识库贡献、工具复用、效率提升）",
      "方法引入与优化（关键词：引入新方法、流程优化、效率对比）"
    ],
    "L3": [
      "创新项目主导（关键词：跨部门合作、创新模块、效率提升≥20%）",
      "行业认可与突破（关键词：公司认可、行业奖项、专利产出）"
    ]
  },
  "simplicity": {
    "L2": [
      "流程优化与提效（关键词：流程简化、工具应用、解决低效）",
      "问题发现与解决（关键词：发现问题、重复性低效、解决方案）"
    ],
    "L3": [
      "挑战目标达成（关键词：挑战性目标、超额完成、OKR实现）",
      "氛围引领与激励（关键词：激励他人、精神支柱、向上氛围）"
    ]
  },
  "professionalism": {
    "L2": [
      "专业问题解决（关键词：复杂问题、独立解决、改进方案）",
      "持续学习与认证（关键词：高阶认证、专业培训、能力提升）"
    ],
    "L3": [
      "行业趋势洞察（关键词：趋势分析、前瞻策略、行业报告）",
      "专家影响力（关键词：公认专家、创新流程、服务提升）"
    ]
  },
  "dedication": {
    "L2": [
      "攻坚克难（关键词：挑战任务、高效推进、问题解决）",
      "自驱超额完成（关键词：超额完成≥120%、目标达成、业绩数据）"
    ],
    "L3": [
      "压力应对与担当（关键词：关键时刻、顶住压力、保障完成）",
      "奋斗文化引领（关键词：文化引领、团队影响、正向反馈）"
    ]
  }
};

export const FORM_JSON: FormTemplate = {
  "formUuid": "cultural_value_score_form_v2",
  "icon": "https://img.alicdn.com/imgextra/i1/O1CN01aT5z5Z1Xq5Q5Q5Q5Q_!!6000000002947-55-tps-100-100.svg",
  "title": "文化价值观贡献案例积分申请表",
  "description": "请根据《文化价值观贡献度积分表》如实填写。行为项现已支持维度联动，积分根据层级自动核算。",
  "items": [
    {
      "componentName": "HeaderField",
      "props": {
        "title": "申请人信息",
        "description": "系统将自动填充部分信息"
      }
    },
    {
      "componentName": "DDSelectField",
      "name": "applicant_name",
      "label": "申请人姓名",
      "required": true,
      "props": {
        "placeholder": "请选择申请人",
        "dataSource": "staffList",
        "showSearch": true
      }
    },
    {
      "componentName": "DepartmentPicker",
      "name": "applicant_department",
      "label": "所在部门",
      "required": true,
      "props": {
        "placeholder": "请选择部门"
      }
    },
    {
      "componentName": "DDSelectField",
      "name": "applicant_position",
      "label": "岗位",
      "required": true,
      "props": {
        "placeholder": "请选择岗位",
        "dataSource": "positionList"
      }
    },
    {
      "componentName": "DDDateField",
      "name": "apply_date",
      "label": "申请日期",
      "required": true,
      "props": {
        "format": "yyyy-MM-dd",
        "defaultValue": "today"
      }
    },
    {
      "componentName": "HeaderField",
      "props": {
        "title": "案例信息",
        "description": "请选择对应的价值观维度和行为层级，系统将自动匹配行为范例"
      }
    },
    {
      "componentName": "DDInputField",
      "name": "case_title",
      "label": "案例标题",
      "required": true,
      "props": {
        "placeholder": "例如：成功化解客户XX项目的重大投诉",
        "maxLength": 50
      }
    },
    {
      "componentName": "DDSelectField",
      "name": "value_dimension",
      "label": "文化价值观维度",
      "required": true,
      "props": {
        "placeholder": "请选择",
        "options": [
          { "label": "客户至上", "value": "customer_first" },
          { "label": "团队协作", "value": "teamwork" },
          { "label": "开放创新", "value": "innovation" },
          { "label": "简单向上", "value": "simplicity" },
          { "label": "专业专注", "value": "professionalism" },
          { "label": "崇尚奋斗", "value": "dedication" }
        ]
      }
    },
    {
      "componentName": "DDRadioField",
      "name": "behavior_level",
      "label": "行为层级",
      "required": true,
      "props": {
        "options": [
          { "label": "L2 进阶 (5分)", "value": "L2" },
          { "label": "L3 卓越 (10分)", "value": "L3" }
        ]
      }
    },
    {
      "componentName": "HeaderField",
      "props": {
        "title": "行为选择与描述",
        "description": "请从匹配的范例中选择一项最符合的行为"
      }
    },
    {
      "componentName": "BehaviorSelector",
      "name": "behavior_items",
      "label": "具体行为范例",
      "required": true,
      "props": {}
    },
    {
      "componentName": "DDTextAreaField",
      "name": "case_description",
      "label": "案例详细描述",
      "required": true,
      "props": {
        "placeholder": "请描述时间、背景、具体行为、结果及影响（500字以内）",
        "maxLength": 500,
        "rows": 4
      }
    },
    {
      "componentName": "DDRadioField",
      "name": "is_repeat_application",
      "label": "是否重复申报",
      "required": true,
      "props": {
        "options": [
          { "label": "否", "value": "no" },
          { "label": "是", "value": "yes" }
        ]
      }
    },
    {
      "componentName": "DDTextAreaField",
      "name": "repeat_reason",
      "label": "重复申报原因说明",
      "required": false,
      "hidden": true,
      "props": {
        "placeholder": "请说明本次申报与之前申报的差异或新增价值",
        "maxLength": 200,
        "rows": 2
      }
    },
    {
      "componentName": "HeaderField",
      "props": {
        "title": "积分自动计算",
        "description": "系统将根据所选行为层级自动计算积分"
      }
    },
    {
      "componentName": "NumberField",
      "name": "total_score",
      "label": "本次申请总积分",
      "required": false,
      "props": {
        "placeholder": "自动核算",
        "disabled": true
      }
    },
    {
      "componentName": "HeaderField",
      "props": {
        "title": "证据材料",
        "description": "请上传相关证明材料，确保真实可查"
      }
    },
    {
      "componentName": "DDAttachment",
      "name": "evidence_files",
      "label": "上传证据附件",
      "required": true,
      "props": {
        "maxSize": 20,
        "maxCount": 5,
        "fileTypes": ["jpg", "png", "pdf", "doc", "docx", "xls", "xlsx", "txt"]
      }
    },
    {
      "componentName": "DDTextAreaField",
      "name": "evidence_description",
      "label": "证据说明",
      "required": true,
      "props": {
        "placeholder": "简述证据内容与案例的关联性，如“客户感谢邮件截图”",
        "maxLength": 200,
        "rows": 2
      }
    },
    {
      "componentName": "HeaderField",
      "props": {
        "title": "填写须知",
        "description": ""
      }
    },
    {
      "componentName": "NoteField",
      "name": "notice",
      "props": {
        "text": "1. 请确保行为真实、证据完整。\n2. L2层级行为计5分，L3层级行为计10分，每次仅可申报一项关键行为。\n3. 同一行为不可重复申报，除非有明显增量价值。\n4. 积分最终以评审委员会确认为准。"
      }
    }
  ],
  "settings": {
    "submitButtonText": "提交申请",
    "resetButtonText": "重新填写",
    "bizType": "cultural_score_application"
  }
};

export const STAFF_LIST = [
  { label: '张伟', value: 'zhangwei' },
  { label: '王芳', value: 'wangfang' },
  { label: '李娜', value: 'lina' },
  { label: '刘强', value: 'liuqiang' },
];

export const DEPARTMENT_LIST = [
  { label: '研发部', value: 'rd' },
  { label: '市场部', value: 'marketing' },
  { label: '人力资源部', value: 'hr' },
  { label: '客户服务部', value: 'cs' },
];

export const POSITION_LIST = [
  { label: '前端工程师', value: 'frontend' },
  { label: '后端工程师', value: 'backend' },
  { label: '产品经理', value: 'pm' },
  { label: '客户主管', value: 'cs_manager' },
];

export const STAFF_RECORDS: StaffRecord[] = [
  { 
    id: '1', name: '张伟', employeeId: 'DT001', score: 125, status: 'active', role: 'super_admin', joinDate: '2021-06-15',
    history: [
      { id: 'h1', date: '2023-11-20', description: '成功解决双十一期间的核心链路阻塞问题', dimension: '专业专注', amount: 20, status: 'approved' },
      { id: 'h2', date: '2023-12-05', description: '主动带教3名新入职后端工程师', dimension: '团队协作', amount: 15, status: 'approved' },
      { id: 'h3', date: '2024-01-10', description: '优化前端构建工具，减少30%编译时间', dimension: '开放创新', amount: 10, status: 'approved' }
    ]
  },
  { 
    id: '2', name: '王芳', employeeId: 'DT002', score: 98, status: 'active', role: 'admin', joinDate: '2022-03-10',
    history: [
      { id: 'h4', date: '2023-10-15', description: '主导客户侧满意度调研并形成闭环报告', dimension: '客户至上', amount: 15, status: 'approved' },
      { id: 'h5', date: '2023-12-12', description: '整理发布部门通用技术方案模板', dimension: '团队协作', amount: 8, status: 'approved' }
    ]
  },
  { 
    id: '3', name: '李娜', employeeId: 'DT003', score: 156, status: 'active', role: 'employee', joinDate: '2021-11-20',
    history: [
      { id: 'h6', date: '2023-11-01', description: '攻克大型政企客户私有化部署难题', dimension: '崇尚奋斗', amount: 25, status: 'approved' },
      { id: 'h7', date: '2024-01-05', description: '提炼出3个可复用的业务中台组件', dimension: '开放创新', amount: 15, status: 'approved' }
    ]
  },
  { 
    id: '4', name: '刘强', employeeId: 'DT004', score: 42, status: 'inactive', role: 'employee', joinDate: '2023-08-01',
    history: [
      { id: 'h8', date: '2023-09-20', description: '日常技术分享会组织', dimension: '简单向上', amount: 5, status: 'approved' }
    ]
  },
  { id: '5', name: '陈静', employeeId: 'DT005', score: 87, status: 'active', role: 'employee', joinDate: '2022-07-15', history: [] },
];
