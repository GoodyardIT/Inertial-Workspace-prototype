
import { FormTemplate } from './types';

export const FORM_JSON: FormTemplate = {
  "formUuid": "cultural_value_score_form_v1",
  "icon": "https://img.alicdn.com/imgextra/i1/O1CN01aT5z5Z1Xq5Q5Q5Q5Q_!!6000000002947-55-tps-100-100.svg",
  "title": "文化价值观贡献案例积分申请表",
  "description": "请根据《文化价值观贡献度积分表》如实填写，每次申请可包含多个行为项。",
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
        "description": "请选择对应的价值观维度和行为层级"
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
          { "label": "L2 进阶（每项5分）", "value": "L2" },
          { "label": "L3 卓越（每项10分）", "value": "L3" }
        ]
      }
    },
    {
      "componentName": "HeaderField",
      "props": {
        "title": "行为选择与描述",
        "description": "请勾选符合的行为范例，并简要描述"
      }
    },
    {
      "componentName": "DDCheckboxField",
      "name": "behavior_items",
      "label": "具体行为范例",
      "required": true,
      "props": {
        "options": [
          { "label": "主动了解背景，提供个性化解决方案", "value": "cust_L2_1", "score": 5 },
          { "label": "预警潜在问题并提供防范建议", "value": "cust_L2_2", "score": 5 },
          { "label": "妥善处理复杂投诉，获得客户书面认可", "value": "cust_L2_3", "score": 5 },
          { "label": "形成客户潜在需求报告并推动改进", "value": "cust_L3_1", "score": 10 },
          { "label": "将客户发展为长期战略合作伙伴", "value": "cust_L3_2", "score": 10 },
          { "label": "客户主动代言或引荐新客户", "value": "cust_L3_3", "score": 10 },
          { "label": "主动承担额外工作保障团队目标", "value": "team_L2_1", "score": 5 },
          { "label": "主动分享经验或模板帮助同事", "value": "team_L2_2", "score": 5 },
          { "label": "主动调解团队小摩擦促成共识", "value": "team_L2_3", "score": 5 },
          { "label": "发起建立提升协作效率的新机制", "value": "team_L3_1", "score": 10 },
          { "label": "组织跨团队活动提升信任与默契", "value": "team_L3_2", "score": 10 },
          { "label": "在复杂项目中成为关键纽带推动突破", "value": "team_L3_3", "score": 10 }
        ]
      }
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
        "description": "系统将根据所选行为自动计算积分"
      }
    },
    {
      "componentName": "NumberField",
      "name": "item_score",
      "label": "单项积分",
      "required": false,
      // Fix: 'disabled' is only valid within 'props' (FormItemProps)
      "props": {
        "placeholder": "自动计算",
        "disabled": true
      }
    },
    {
      "componentName": "NumberField",
      "name": "total_score",
      "label": "本次申请总积分",
      "required": false,
      // Fix: 'disabled' is only valid within 'props' (FormItemProps)
      "props": {
        "placeholder": "自动累计",
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
        "placeholder": "简述证据内容与案例的关联性，如“客户感谢邮件截图”、“项目报告第X页”等",
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
        "text": "1. 请确保行为真实、证据完整。\n2. 同一行为不可重复申报，除非有明显增量价值。\n3. 如涉及多人合作，请分别填写，并注明协作关系。\n4. 积分最终以评审委员会确认为准。\n5. 如有疑问，请联系人力资源部。"
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
