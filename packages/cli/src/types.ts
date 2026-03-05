export type CommonOptions = {
  baseUrl: string;
  timeoutMs: number;
  raw: boolean;
  json: boolean;
};

export type ListOptions = CommonOptions & {
  page: number;
  limit: number;
};

export type StoryOptions = CommonOptions & {
  limit: number;
};
