export interface FamilyMember {
  id: number;
  uu_id?: string;
  name: string;
  surname?: string;
  middle_name?: string;
  gender: 'male' | 'female';
  birthday?: string;
  death_year?: string;
  father_id?: number;
  mother_id?: number;
  father?: FamilyMember;
  mother?: FamilyMember;
  husband_marriages?: Marriage[];
  wife_marriages?: Marriage[];
  father_children?: FamilyMember[];
  mother_children?: FamilyMember[];
  created_at?: string;
  updated_at?: string;
  ssn?: string;
  birthplace?: string;
  address?: string;
  phone_numbers?: string[];
  email_addresses?: string[];
  education?: string[];
  degree?: string;
  biography?: string;
  experience?: string[];
  photo?: string | null;
  images?: any[];
  translations?: any[];
  media?: any[];
}

export interface Marriage {
  id: number;
  husband_id: number;
  wife_id: number;
  marriage_year?: number;
  divorce_year?: number | null;
  spouse_status?: string;
  husband?: FamilyMember;
  wife?: FamilyMember;
  created_at?: string;
  updated_at?: string;
}

export interface Translation {
  name: string;
  surname: string;
  birthplace: string | null;
  address: string | null;
  education: string | null;
  degree: string | null;
  biography: string | null;
  experience: string | null;
  birthday: string;
  death_year: string | null;
  uu_id: string;
  gender?: string;
}

export interface CommonPersonBase {
  id: number;
  uu_id: string;
  name: string;
  surname: string;
  birthplace: string | null;
  address: string | null;
  education: string | null;
  degree: string | null;
  biography: string | null;
  experience: string | null;
  birthday: string;
  death_year: string;
  gender: string;
  translation: Translation[];  // Array for nested fathers
  father?: CommonPersonBase;
}

export interface CommonResponseMember {
  id: number;
  uu_id: string;
  name: string;
  surname: string;
  birthplace: string | null;
  address: string | null;
  education: string | null;
  degree: string | null;
  biography: string | null;
  experience: string | null;
  birthday: string;
  death_year: string;
  gender: string;
  translation: Translation;
  father?: CommonPersonBase;
}

export interface CommonResponseMemberFather {
  address: string;
  biography: string;
  birthday: string;
  birthplace: string;
  death_year: string;
  degree: string;
  education: string;
  experience: string;
  father: CommonResponseMemberFather;
  id: number;
  name: string;
  surname: string;
  translation: Translation[];
}

export interface Lineage {
  id?: number;
  uu_id: string;
  name: string;
  surname: string;
  birthplace: string | null;
  address: string | null;
  education: string | null;
  degree: string | null;
  biography: string | null;
  experience: string | null;
  birthday: string;
  death_year: string | null;
  gender: string;
}

export interface CommonAncestorResponse {
  message: string;
  common_ancestor: CommonResponseMember;
  member1: CommonResponseMember;
  member2: CommonResponseMember;
}

export interface DialogData {
  nodeData: any;
  isConnection?: boolean;
  isIndividual?: boolean;
}

export interface UnityMessage {
  data: string;
  language: number;
  type: string
}

export enum Languages {
  'hy' = 0,
  'ru' = 1,
  'en' = 2
}
export const EngLang = 'en';
export const ArmLang = 'hy';
export const RuLang = 'ru';