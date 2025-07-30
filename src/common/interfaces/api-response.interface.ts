export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
  }
  
  export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
  
  export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    meta: PaginationMeta;
  }