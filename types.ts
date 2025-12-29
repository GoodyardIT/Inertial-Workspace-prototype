
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

export interface Submission {
  id: string;
  timestamp: string;
  data: FormData;
  status: 'pending' | 'approved' | 'rejected';
}
