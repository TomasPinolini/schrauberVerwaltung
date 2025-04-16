export interface Attribute {
  id: number;
  name: string;
  default_value: string | null;
  format_data: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttributeValue {
  id: number;
  screwdriver_id: number;
  attribute_id: number;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface BaseScrewdriver {
  id: number;
  name: string;
  parent_id: number | null;
  type: 'category' | 'instance';
  created_at: string;
  updated_at: string;
}

export interface Instance extends BaseScrewdriver {
  type: 'instance';
  attributeValues: AttributeValue[];
}

export interface Category extends BaseScrewdriver {
  type: 'category';
  children: (Category | Instance)[];
}

export type Screwdriver = Category | Instance;

export const isInstance = (screwdriver: Screwdriver): screwdriver is Instance => {
  return screwdriver.type === 'instance';
};

export const isCategory = (screwdriver: Screwdriver): screwdriver is Category => {
  return screwdriver.type === 'category';
}; 