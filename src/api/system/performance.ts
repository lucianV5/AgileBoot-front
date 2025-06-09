import { http } from "@/utils/http";

export interface PerformanceQuery extends BasePageQuery {
  pageNum: number;
  pageSize: number;
  userId?: number;
  userName?: string;
  deptId?: number;
  year?: number;
  quarter?: number;
  beginTime?: string;
  endTime?: string;
}

export interface PerformanceVO {
  performanceId: number;
  userId: number;
  userName?: string;
  deptId: number;
  deptName?: string;
  year: number;
  quarter: number;
  deptScore: number;
  personalScore: number;
  totalScore: number;
  remark?: string;
  createTime: string;
}

export interface PerformanceForm {
  performanceId?: number;
  userId: number;
  deptId: number;
  year: number;
  quarter: number;
  deptScore: number;
  personalScore: number;
  totalScore?: number;
  remark?: string;
}

/** 查询绩效列表 */
export const getPerformanceList = (params: PerformanceQuery) => {
  return http.request<ResponseData<PageDTO<PerformanceVO>>>(
    "get",
    "/system/performance/list",
    { params }
  );
};

/** 查询绩效详细 */
export const getPerformance = (performanceId: number) => {
  return http.request<ResponseData<PerformanceVO>>(
    "get",
    `/system/performance/${performanceId}`
  );
};

/** 新增绩效 */
export const addPerformance = (data: PerformanceForm) => {
  return http.request<ResponseData<void>>("post", "/system/performance", {
    data
  });
};

/** 修改绩效 */
export const updatePerformance = (data: PerformanceForm) => {
  return http.request<ResponseData<void>>("put", "/system/performance", {
    data
  });
};

/** 删除绩效 */
export const deletePerformance = (performanceIds: number[]) => {
  return http.request<ResponseData<void>>(
    "delete",
    `/system/performance/${performanceIds}`
  );
};

/** 导出绩效 */
export const exportPerformance = (params: PerformanceQuery) => {
  return http.request<BlobPart>("get", `/system/performance/export`, {
    params,
    responseType: "blob"
  });
};
