
export type UserRole = 'super_admin' | 'admin' | 'employee';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface FormOption {
  label: string;
  value: string;
  score?: number;
}

export interface FormItemProps {
  title?: string;
  description?: string;
  placeholder?: string;
  dataSource?: string;
  showSearch?: boolean;
  format?: string;
  defaultValue?: string;
  maxLength?: number;
  options?: FormOption[];
  rows?: number;
  hidden?: boolean;
  disabled?: boolean;
  maxSize?: number;
  maxCount?: number;
  fileTypes?: string[];
  text?: string;
}

export interface FormItem {
  componentName: string;
  name?: string;
  label?: string;
  required?: boolean;
  props: FormItemProps;
  hidden?: boolean;
}

export interface FormSettings {
  submitButtonText: string;
  resetButtonText: string;
  bizType: string;
}

export interface FormTemplate {
  formUuid: string;
  icon: string;
  title: string;
  description: string;
  items: FormItem[];
  settings: FormSettings;
}

export interface FormData {
  [key: string]: any;
}

export interface PointHistoryEntry {
  id: string;
  date: string;
  description: string;
  dimension: string;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  opinion?: string;
}

export interface StaffRecord {
  id: string;
  name: string;
  employeeId: string;
  password: string;
  score: number;
  loginCount: number; // 新增：登录次数统计
  status: 'active' | 'inactive';
  role: UserRole;
  joinDate: string;
  history?: PointHistoryEntry[];
}

export interface ApplicationRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  title: string;
  dimension: string;
  description: string;
  requestedScore: number;
  submitTime: string;
  status: ApprovalStatus;
  adminOpinion?: string;
}
