export type WpisHistoriiPubliczny = {
  id: string;
  title: string;
  short_description: string | null;
  body?: string | null;
  event_date: string | null;
  era_label: string | null;
  created_at: string;
  media_urls: string[];
  source_links: string[];
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  view_count: number;
  candle_count: number;
  is_featured: boolean;
};

export type WpisHistoriiPanel = WpisHistoriiPubliczny & {
  status: string;
  published_at: string | null;
  updated_at: string;
  author_id: string | null;
};
