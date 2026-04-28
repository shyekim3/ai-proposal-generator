export interface ScrapeResult {
  url: string;
  title: string;
  byline: string | null;
  excerpt: string | null;
  text: string;
  length: number;
}

export type TemplateKey = "business" | "marketing" | "bid" | "general" | "custom";

export interface Template {
  key: TemplateKey;
  label: string;
  description: string;
}

export interface ProposalRecord {
  id: string;
  created_at: string;
  source_url: string;
  source_title: string;
  template_key: TemplateKey;
  custom_form: string | null;
  result_md: string;
  model: string | null;
}
