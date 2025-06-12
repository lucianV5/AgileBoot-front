<template>
  <div class="main">
    <el-card shadow="never" class="search-wrapper">
      <el-form
        ref="searchFormRef"
        :model="searchParams"
        :inline="true"
        @keyup.enter="handleQuery"
      >
        <el-form-item :label="t('performance.userName')" prop="userName">
          <el-input
            v-model="searchParams.userName"
            clearable
            placeholder="请输入用户名称"
          />
        </el-form-item>
        <el-form-item :label="t('performance.deptName')" prop="deptId">
          <el-tree-select
            v-model="searchParams.deptId"
            :data="deptOptions"
            :props="{
              label: 'label',
              value: 'id',
              children: 'children'
            }"
            placeholder="请选择部门名称"
            clearable
            filterable
            :default-expand-all="true"
          />
        </el-form-item>
        <el-form-item :label="t('performance.year')" prop="year">
          <el-select
            v-model="searchParams.year"
            clearable
            placeholder="请选择年份"
          >
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year"
              :value="year"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('performance.quarter')" prop="quarter">
          <el-select
            v-model="searchParams.quarter"
            clearable
            placeholder="请选择季度"
          >
            <el-option
              v-for="quarter in quarterOptions"
              :key="quarter"
              :label="`第${quarter}季度`"
              :value="quarter"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('performance.createTime')" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="handleQuery"
          >
            搜索
          </el-button>
          <el-button :icon="useRenderIcon(Refresh)" @click="resetQuery">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-wrapper">
      <div class="header-operation">
        <el-button
          v-hasPerm="['system:performance:add']"
          type="primary"
          :icon="useRenderIcon(AddFill)"
          @click="handleAdd"
        >
          添加
        </el-button>
        <el-button
          v-hasPerm="['system:performance:remove']"
          type="danger"
          :disabled="multiple"
          :icon="useRenderIcon(Delete)"
          @click="() => handleDelete(ids)"
        >
          删除
        </el-button>
        <el-button
          v-hasPerm="['system:performance:export']"
          type="warning"
          :icon="useRenderIcon(Download)"
          @click="handleExport"
        >
          导出
        </el-button>
      </div>

      <pure-table
        ref="tableRef"
        :data="performanceList"
        :columns="columns"
        :loading="loading"
        :pagination="{
          total,
          pageSize: searchParams.pageSize,
          currentPage: searchParams.pageNum,
          background: true,
          layout: 'total, sizes, prev, pager, next, jumper'
        }"
        @page-size-change="handleSizeChange"
        @page-current-change="handleCurrentChange"
        @selection-change="handleSelectionChange"
      >
        <template #operation="{ row }">
          <el-button
            v-hasPerm="['system:performance:edit']"
            type="primary"
            link
            :icon="useRenderIcon(EditPen)"
            @click="handleUpdate(row)"
          >
            修改
          </el-button>
          <el-button
            v-hasPerm="['system:performance:remove']"
            type="primary"
            link
            :icon="useRenderIcon(Delete)"
            @click="handleDelete([row.performanceId])"
          >
            删除
          </el-button>
        </template>
      </pure-table>
    </el-card>

    <!-- 添加绩效分析图表 -->
    <performance-chart />

    <!-- 添加或修改绩效对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="600px"
      append-to-body
    >
      <el-form
        ref="performanceFormRef"
        :model="performanceForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item :label="t('performance.userName')" prop="userId">
          <el-select
            v-model="performanceForm.userId"
            filterable
            remote
            :remote-method="(query: string) => debouncedSearch.start(query)"
            :loading="userLoading"
            placeholder="请输入用户名搜索"
            @change="handleUserChange"
          >
            <el-option
              v-for="item in userOptions"
              :key="item.userId"
              :label="item.nickname || item.username"
              :value="item.userId"
            />
            <template #empty>
              <div class="empty-text">
                {{ userLoading ? "加载中..." : "无匹配数据" }}
              </div>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('performance.deptName')" prop="deptId">
          <el-tree-select
            v-model="performanceForm.deptId"
            :data="deptOptions"
            :props="{
              label: 'label',
              value: 'id',
              children: 'children'
            }"
            placeholder="请选择部门"
            filterable
            :default-expand-all="true"
            :disabled="!performanceForm.userId"
          />
        </el-form-item>
        <el-form-item :label="t('performance.year')" prop="year">
          <el-select v-model="performanceForm.year" placeholder="请选择年份">
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year"
              :value="year"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('performance.quarter')" prop="quarter">
          <el-select v-model="performanceForm.quarter" placeholder="请选择季度">
            <el-option
              v-for="quarter in quarterOptions"
              :key="quarter"
              :label="`第${quarter}季度`"
              :value="quarter"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('performance.deptScore')" prop="deptScore">
          <el-input-number
            v-model="performanceForm.deptScore"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.5"
            @change="calculateTotalScore"
          />
        </el-form-item>
        <el-form-item
          :label="t('performance.personalScore')"
          prop="personalScore"
        >
          <el-input-number
            v-model="performanceForm.personalScore"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.5"
            @change="calculateTotalScore"
          />
        </el-form-item>
        <el-form-item :label="t('performance.totalScore')" prop="totalScore">
          <el-input-number
            v-model="performanceForm.totalScore"
            :min="0"
            :max="100"
            :precision="2"
            :step="0.5"
            disabled
          />
        </el-form-item>
        <el-form-item :label="t('performance.remark')" prop="remark">
          <el-input
            v-model="performanceForm.remark"
            type="textarea"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确定</el-button>
          <el-button @click="cancel">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox, FormInstance } from "element-plus";
import i18n from "@/locales";
import PerformanceChart from "./components/PerformanceChart.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useTimeoutFn } from "@vueuse/core";

// 导入图标
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Download from "@iconify-icons/ep/download";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/ep/refresh";
import AddFill from "@iconify-icons/ri/add-circle-line";

import {
  getPerformanceList,
  getPerformance,
  addPerformance,
  updatePerformance,
  deletePerformance,
  exportPerformance,
  PerformanceQuery,
  PerformanceVO,
  PerformanceForm
} from "@/api/system/performance";
import {
  DeptTreeDTO,
  getDeptTree as getDeptTreeSelect
} from "@/api/system/dept";
import { getUserListApi } from "@/api/system/user";

const { t } = i18n.global;
const loading = ref(false);
const userLoading = ref(false);
const multiple = ref(true);
const ids = ref<Array<number>>([]);
const total = ref(0);
const performanceList = ref<Array<PerformanceVO>>([]);
const dateRange = ref<[string, string] | undefined>(undefined);
const deptOptions = ref<DeptTreeDTO[]>([]);
const userOptions = ref<Array<any>>([]);

// 生成年份选项，从当前年份往前5年，往后2年
const currentYear = new Date().getFullYear();
const yearOptions = computed(() => {
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 2; i++) {
    years.push(i);
  }
  return years;
});

// 季度选项
const quarterOptions = [1, 2, 3, 4];

// 查询参数
const searchParams = reactive<PerformanceQuery>({
  pageNum: 1,
  pageSize: 10,
  userId: undefined as any,
  userName: undefined as any,
  deptId: undefined as any,
  year: undefined as any,
  quarter: undefined as any,
  beginTime: undefined as any,
  endTime: undefined as any
});

// 表单参数
const performanceForm = reactive<PerformanceForm>({
  userId: undefined as any,
  deptId: undefined as any,
  year: currentYear,
  quarter: Math.ceil((new Date().getMonth() + 1) / 3),
  deptScore: 0,
  personalScore: 0,
  totalScore: 0,
  remark: ""
});

// 表单校验规则
const rules = reactive({
  userId: [
    { required: true, message: t("performance.userRequired"), trigger: "blur" }
  ],
  deptId: [
    { required: true, message: t("performance.deptRequired"), trigger: "blur" }
  ],
  year: [
    { required: true, message: t("performance.yearRequired"), trigger: "blur" }
  ],
  quarter: [
    {
      required: true,
      message: t("performance.quarterRequired"),
      trigger: "blur"
    }
  ],
  deptScore: [
    {
      required: true,
      message: t("performance.deptScoreRequired"),
      trigger: "blur"
    }
  ],
  personalScore: [
    {
      required: true,
      message: t("performance.personalScoreRequired"),
      trigger: "blur"
    }
  ]
});

// 弹窗参数
const dialog = reactive({
  visible: false,
  title: ""
});

// 表格列定义
const columns = [
  { type: "selection", width: 55 },
  { label: t("performance.userName"), prop: "userName", minWidth: 120 },
  { label: t("performance.deptName"), prop: "deptName", minWidth: 120 },
  { label: t("performance.year"), prop: "year", minWidth: 100 },
  {
    label: t("performance.quarter"),
    prop: "quarter",
    minWidth: 100,
    formatter: (row: PerformanceVO) => `第${row.quarter}季度`
  },
  {
    label: t("performance.deptScore"),
    prop: "deptScore",
    minWidth: 120,
    formatter: (row: PerformanceVO) => `${row.deptScore.toFixed(2)}`
  },
  {
    label: t("performance.personalScore"),
    prop: "personalScore",
    minWidth: 120,
    formatter: (row: PerformanceVO) => `${row.personalScore.toFixed(2)}`
  },
  {
    label: t("performance.totalScore"),
    prop: "totalScore",
    minWidth: 120,
    formatter: (row: PerformanceVO) => `${row.totalScore.toFixed(2)}`
  },
  { label: t("performance.createTime"), prop: "createTime", minWidth: 180 },
  { label: t("performance.updateTime"), prop: "updateTime", minWidth: 180 },
  {
    label: "操作",
    fixed: "right",
    width: 160,
    slot: "operation"
  }
];

const searchFormRef = ref<FormInstance>();
const performanceFormRef = ref<FormInstance>();
const tableRef = ref();

/** 查询绩效列表 */
const getList = async () => {
  loading.value = true;
  try {
    // 创建一个新的查询参数对象，而不是修改原始对象
    const queryParams: PerformanceQuery = {
      pageNum: searchParams.pageNum,
      pageSize: searchParams.pageSize,
      userId: searchParams.userId,
      userName: searchParams.userName,
      deptId: searchParams.deptId,
      year: searchParams.year,
      quarter: searchParams.quarter
    };

    // 处理日期范围
    if (
      dateRange.value &&
      dateRange.value.length === 2 &&
      dateRange.value[0] &&
      dateRange.value[1]
    ) {
      queryParams.beginTime = dateRange.value[0];
      queryParams.endTime = dateRange.value[1];
    }

    console.log("查询参数:", queryParams); // 调试用，查看参数是否正确传递

    const res = await getPerformanceList(queryParams);
    performanceList.value = res.data.rows;
    total.value = res.data.total;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

/** 查询部门下拉树结构 */
const getDeptTree = async () => {
  try {
    const res = await getDeptTreeSelect();
    console.log("原始部门数据:", JSON.stringify(res.data, null, 2));
    // 处理部门数据，适配el-tree-select组件需要的格式
    const formatDeptData = (data: DeptTreeDTO | DeptTreeDTO[]): DeptTreeDTO[] => {
      if (!data) return [];
      const deptData = Array.isArray(data) ? data : [data];
      const processDept = (dept: DeptTreeDTO): DeptTreeDTO | null => {
        if (!dept) return null;
        // 保留原始数据的所有字段
        const result: DeptTreeDTO = {
          ...dept,
          children: []
        };
        if (dept.children && Array.isArray(dept.children)) {
          result.children = dept.children
            .map((child: DeptTreeDTO) => processDept(child))
            .filter((item): item is DeptTreeDTO => item !== null);
        }
        return result;
      };
      return deptData.map(dept => processDept(dept)).filter((item): item is DeptTreeDTO => item !== null);
    };
    deptOptions.value = formatDeptData(res.data);
    console.log(
      "格式化后的部门数据:",
      JSON.stringify(deptOptions.value, null, 2)
    );
    if (deptOptions.value.length === 0) {
      console.error("部门数据为空或格式不正确");
    }
  } catch (error) {
    console.error("获取部门数据失败:", error);
    deptOptions.value = [];
  }
};

/** 用户选择变化处理 */
const handleUserChange = (userId: number) => {
  const selectedUser = userOptions.value.find(user => user.userId === userId);
  if (selectedUser) {
    performanceForm.deptId = selectedUser.deptId;
  }
};

/** 远程搜索用户 */
const remoteUserSearch = async (query: string) => {
  if (query.length < 2) {
    userOptions.value = [];
    return;
  }

  userLoading.value = true;
  try {
    const res = await getUserListApi({
      username: query,
      pageSize: 10,
      pageNum: 1
    });
    userOptions.value = res.data.rows;
  } finally {
    userLoading.value = false;
  }
};

/** 防抖搜索 */
const debouncedSearch = useTimeoutFn((query: string) => {
  remoteUserSearch(query);
}, 300);

/** 初始加载用户数据 */
const loadInitialUsers = async () => {
  userLoading.value = true;
  try {
    const res = await getUserListApi({
      pageSize: 10,
      pageNum: 1
    });
    userOptions.value = res.data.rows;
  } finally {
    userLoading.value = false;
  }
};

/** 计算总分 */
const calculateTotalScore = () => {
  // 部门分占比70%，个人分占比30%
  performanceForm.totalScore = Number(
    (
      performanceForm.deptScore * 0.7 +
      performanceForm.personalScore * 0.3
    ).toFixed(2)
  );
};

/** 表单重置 */
const reset = () => {
  performanceFormRef.value?.resetFields();
  performanceForm.performanceId = undefined;
  performanceForm.userId = undefined as any;
  performanceForm.deptId = undefined as any;
  performanceForm.year = currentYear;
  performanceForm.quarter = Math.ceil((new Date().getMonth() + 1) / 3);
  performanceForm.deptScore = 0;
  performanceForm.personalScore = 0;
  performanceForm.totalScore = 0;
  performanceForm.remark = "";
};

/** 日期范围变化处理 */
const handleDateRangeChange = (val: [string, string] | null) => {
  console.log("日期范围变化:", val);
};

/** 搜索按钮操作 */
const handleQuery = () => {
  searchParams.pageNum = 1;
  // 确保日期范围参数正确传递
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  dateRange.value = undefined;
  searchFormRef.value?.resetFields();
  // 重置后立即查询
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: any[]) => {
  ids.value = selection.map(item => item.performanceId);
  multiple.value = !selection.length;
};

/** 分页大小改变 */
const handleSizeChange = (val: number) => {
  searchParams.pageSize = val;
  getList();
};

/** 分页页码改变 */
const handleCurrentChange = (val: number) => {
  searchParams.pageNum = val;
  getList();
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = "新增绩效";
  loadInitialUsers(); // 打开弹窗时加载初始数据
};

/** 修改按钮操作 */
const handleUpdate = async (row: PerformanceVO) => {
  reset();
  const performanceId = row.performanceId || ids.value[0];
  const res = await getPerformance(performanceId);
  Object.assign(performanceForm, res.data);
  dialog.visible = true;
  dialog.title = "修改绩效";
};

/** 提交按钮 */
const submitForm = () => {
  performanceFormRef.value?.validate(async valid => {
    if (valid) {
      // 确保总分已计算
      calculateTotalScore();

      try {
        if (performanceForm.performanceId) {
          await updatePerformance(performanceForm);
          ElMessage.success("修改成功");
        } else {
          await addPerformance(performanceForm);
          ElMessage.success("新增成功");
        }
        dialog.visible = false;
        getList();
      } catch (error) {
        console.error(error);
      }
    }
  });
};

/** 删除按钮操作 */
const handleDelete = (performanceIds: number[]) => {
  const idsToDelete = performanceIds || ids.value;
  if (!idsToDelete.length) {
    ElMessage.warning("请选择要删除的数据");
    return;
  }

  ElMessageBox.confirm("是否确认删除?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await deletePerformance(idsToDelete);
        getList();
        ElMessage.success("删除成功");
      } catch (error) {
        console.error(error);
      }
    })
    .catch(() => {});
};

/** 导出按钮操作 */
const handleExport = () => {
  // 创建一个新的查询参数对象
  const queryParams: PerformanceQuery = {
    pageNum: searchParams.pageNum,
    pageSize: searchParams.pageSize,
    userId: searchParams.userId,
    userName: searchParams.userName,
    deptId: searchParams.deptId,
    year: searchParams.year,
    quarter: searchParams.quarter
  };

  // 处理日期范围
  if (
    dateRange.value &&
    dateRange.value.length === 2 &&
    dateRange.value[0] &&
    dateRange.value[1]
  ) {
    queryParams.beginTime = dateRange.value[0];
    queryParams.endTime = dateRange.value[1];
  }

  console.log("导出参数:", queryParams); // 调试用，查看参数是否正确传递

  exportPerformance(queryParams)
    .then(res => {
      const blob = new Blob([res], { type: "application/vnd.ms-excel" });
      const fileName = `performance_${new Date().getTime()}.xlsx`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch(error => {
      console.error(error);
      ElMessage.error("导出失败");
    });
};

/** 取消按钮 */
const cancel = () => {
  dialog.visible = false;
  reset();
};

onMounted(() => {
  // 先加载部门数据，再加载列表
  getDeptTree().then(() => {
    getList();
  });
});
// 已在顶部定义t函数
</script>

<style lang="scss" scoped>
.search-wrapper {
  margin-bottom: 10px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.table-wrapper {
  .header-operation {
    margin-bottom: 16px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

.empty-text {
  padding: 8px 0;
  color: var(--el-text-color-secondary);
  text-align: center;
}
</style>
