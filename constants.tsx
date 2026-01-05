
import { FormTemplate, StaffRecord, UserRole } from './types';

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
      "hidden": true, // 暂时隐藏，后期启用
      "props": {
        "placeholder": "请选择部门"
      }
    },
    {
      "componentName": "DDSelectField",
      "name": "applicant_position",
      "label": "岗位",
      "required": true,
      "hidden": true, // 暂时隐藏，后期启用
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

// 导入的 CSV 人员花名册数据 (共67人)
export const RAW_STAFF_DATA = [
  ["尹存美", "GY110006"], ["苏丽萍", "GY110003"], ["尹存折", "GY120008"], ["张利", "GY120010"], 
  ["刘凤霞", "GY120007"], ["王夏夏", "GY130017"], ["刘志涛", "GY140023"], ["李晓惠", "GY140026"], 
  ["潘贺贺", "GY140027"], ["魏传波", "GY150063"], ["秦婷", "GY150065"], ["施灵珊", "GY150069"], 
  ["向小军", "GY170083"], ["刘怡聪", "GY170092"], ["霍红阳", "GY170087"], ["唐燕燕", "GY180099"], 
  ["李金霞", "GY200122"], ["王宇", "GY200123"], ["杨中魁", "GY200128"], ["候新宇", "GY200129"], 
  ["俞青", "GY210130"], ["王雪艳", "GY210131"], ["毕贞莹", "GY220132"], ["宋香芹", "GY220133"], 
  ["陈佳宇", "GY220135"], ["牛涛", "GY230136"], ["李苗苗", "GY230137"], ["苏晓龙", "GY230138"], 
  ["王小涵", "GY230139"], ["王浩菲", "GY230150"], ["孙欣宇", "GY230151"], ["尹迪", "GY240152"], 
  ["车余佳", "GY240153"], ["金延举", "GY240515"], ["张一方", "GY240516"], ["高菁远", "GY240517"], 
  ["刘加芬", "GY240518"], ["王广慧", "GY240519"], ["刘海印", "GY240520"], ["王汇甲", "GY240521"], 
  ["刘雪梅", "GY240522"], ["葛文慧", "GY240523"], ["毕玉婕", "GY240525"], ["朱晓健", "GY240526"], 
  ["董子源", "GY240527"], ["冯文婕", "GY240528"], ["刘洁", "GY240529"], ["宋强", "GY250530"], 
  ["张兆晗", "GY250531"], ["于晓明", "GY250532"], ["于千惠", "GY250533"], ["刘梦飞", "GY250535"], 
  ["张晓龙", "GY250536"], ["王佳昕", "GY250537"], ["李梦", "GY250538"], ["韩丹阳", "GY250539"], 
  ["孙铬鞠", "GY250551"], ["刘璐姣", "GY250552"], ["王皓", "GY250555"], ["李文璇", "GY250557"], 
  ["王梦瑶", "GY250559"], ["姜延举", "GY250561"], ["权清媛", "GY250562"], ["李若冰", "GY250563"], 
  ["吕衍霖", "GY250565"], ["石晓涵", "GY250566"], ["韩萌", "GY250567"]
];

export const STAFF_RECORDS: StaffRecord[] = RAW_STAFF_DATA.map((item, index) => {
  const employeeId = item[1];
  let role: UserRole = 'employee';
  
  // 根据要求设置特定工号的权限角色
  if (employeeId === 'GY140023') {
    role = 'super_admin'; // 超级管理员：刘志涛
  } else if (employeeId === 'GY240153' || employeeId === 'GY170092') {
    role = 'admin'; // 管理员：车余佳, 刘怡聪
  }

  return {
    id: `staff-${index}`,
    name: item[0],
    employeeId: employeeId,
    password: `${employeeId}@GY`,
    score: 0,
    loginCount: 0, // 初始登录次数为 0
    status: 'active',
    role: role,
    joinDate: '2024-01-01',
    history: []
  };
});

export const STAFF_LIST = RAW_STAFF_DATA.map(item => ({
  label: item[0],
  value: item[1].toLowerCase()
}));

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
