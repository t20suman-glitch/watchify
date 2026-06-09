export type MediaType = "video" | "music";

export interface Media {
  id: string;
  title: string;
  description: string;
  uploaded_by: string;
  media_type: MediaType;
  content_type: string;
  size_bytes: number;
  original_filename: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}
