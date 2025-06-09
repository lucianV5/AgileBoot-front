<template>
  <div class="chart-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ t("performance.performanceAnalysis") }}</span>
          <div class="filter-container">
            <el-select
              v-model="selectedYear"
              :placeholder="t('performance.yearPlaceholder')"
              @change="loadChartData"
            >
              <el-option
                v-for="year in yearOptions"
                :key="year"
                :label="year"
                :value="year"
              />
            </el-select>
            <el-select
              v-model="selectedDeptId"
              :placeholder="t('performance.deptNamePlaceholder')"
              @change="loadChartData"
              clearable
            >
              <el-option
                v-for="dept in deptOptions"
                :key="dept.deptId"
                :label="dept.deptName"
                :value="dept.deptId"
              />
            </el-select>
          </div>
        </div>
      </template>
      <div class="chart-wrapper">
        <div ref="chartRef" class="chart" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, watch } from "vue";
import i18n from "@/locales";
import * as echarts from "echarts";
import { getDeptTree as getDeptTreeApi } from "@/api/system/dept";
import { getPerformanceList } from "@/api/system/performance";

export default defineComponent({
  name: "PerformanceChart",
  setup() {
    const { t } = i18n.global;
    const chartRef = ref<HTMLElement>();
    let chart: echarts.ECharts | null = null;

    // 生成年份选项，从当前年份往前5年，往后2年
    const currentYear = new Date().getFullYear();
    const yearOptions: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      yearOptions.push(i);
    }

    const selectedYear = ref(currentYear);
    const selectedDeptId = ref<number | null>(null);
    const deptOptions = ref<Array<any>>([]);

    // 季度标签
    const quarterLabels = [
      t("performance.quarterLabel1"),
      t("performance.quarterLabel2"),
      t("performance.quarterLabel3"),
      t("performance.quarterLabel4")
    ];

    // 初始化图表
    const initChart = () => {
      if (!chartRef.value) return;

      chart = echarts.init(chartRef.value);

      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow"
          }
        },
        legend: {
          data: [
            t("performance.deptScore"),
            t("performance.personalScore"),
            t("performance.totalScore")
          ]
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: quarterLabels
        },
        yAxis: {
          type: "value",
          min: 0,
          max: 100,
          interval: 20
        },
        series: [
          {
            name: t("performance.deptScore"),
            type: "bar",
            data: [0, 0, 0, 0]
          },
          {
            name: t("performance.personalScore"),
            type: "bar",
            data: [0, 0, 0, 0]
          },
          {
            name: t("performance.totalScore"),
            type: "line",
            data: [0, 0, 0, 0]
          }
        ]
      };

      chart.setOption(option);

      // 响应式调整
      window.addEventListener("resize", handleResize);
    };

    // 处理窗口大小变化
    const handleResize = () => {
      chart?.resize();
    };

    // 加载图表数据
    const loadChartData = async () => {
      if (!chart) return;

      try {
        // 准备查询参数
        const params = {
          pageNum: 1,
          pageSize: 100,
          year: selectedYear.value,
          deptId: selectedDeptId.value || undefined
        };

        const res = await getPerformanceList(params);
        const performanceData = res.data.rows;

        // 按季度整理数据
        const deptScores = [0, 0, 0, 0];
        const personalScores = [0, 0, 0, 0];
        const totalScores = [0, 0, 0, 0];
        const counts = [0, 0, 0, 0];

        performanceData.forEach(item => {
          const quarterIndex = item.quarter - 1;
          if (quarterIndex >= 0 && quarterIndex < 4) {
            deptScores[quarterIndex] += item.deptScore;
            personalScores[quarterIndex] += item.personalScore;
            totalScores[quarterIndex] += item.totalScore;
            counts[quarterIndex]++;
          }
        });

        // 计算平均值
        for (let i = 0; i < 4; i++) {
          if (counts[i] > 0) {
            deptScores[i] = parseFloat((deptScores[i] / counts[i]).toFixed(2));
            personalScores[i] = parseFloat(
              (personalScores[i] / counts[i]).toFixed(2)
            );
            totalScores[i] = parseFloat(
              (totalScores[i] / counts[i]).toFixed(2)
            );
          }
        }

        // 更新图表数据
        chart.setOption({
          series: [
            {
              name: t("performance.deptScore"),
              data: deptScores
            },
            {
              name: t("performance.personalScore"),
              data: personalScores
            },
            {
              name: t("performance.totalScore"),
              data: totalScores
            }
          ]
        });
      } catch (error) {
        console.error("Failed to load performance data:", error);
      }
    };

    // 获取部门树
    const getDeptTree = async () => {
      try {
        const res = await getDeptTreeApi();
        console.log("图表组件部门数据:", res.data); // 调试用

        // 将树形结构扁平化为列表
        const flattenDepts = (depts: any[], result: any[] = []) => {
          if (!depts || !Array.isArray(depts)) return result;

          depts.forEach(dept => {
            if (dept) {
              result.push({
                deptId: dept.id || dept.deptId,
                deptName: dept.label || dept.deptName
              });
              if (dept.children && dept.children.length > 0) {
                flattenDepts(dept.children, result);
              }
            }
          });
          return result;
        };

        // 处理不同的数据结构
        let deptArray = [];
        if (res.data) {
          if (Array.isArray(res.data)) {
            deptArray = res.data;
          } else if (res.data.children && Array.isArray(res.data.children)) {
            deptArray = [res.data];
          } else {
            deptArray = [res.data];
          }
        }

        deptOptions.value = flattenDepts(deptArray);
        console.log("处理后的部门选项:", deptOptions.value); // 调试用
      } catch (error) {
        console.error("Failed to load department data:", error);
        deptOptions.value = [];
      }
    };

    // 监听语言变化，更新图表标题和标签
    watch(
      () => t("performance.performanceAnalysis"),
      () => {
        if (chart) {
          chart.setOption({
            legend: {
              data: [
                t("performance.deptScore"),
                t("performance.personalScore"),
                t("performance.totalScore")
              ]
            },
            xAxis: {
              data: [
                t("performance.quarterLabel1"),
                t("performance.quarterLabel2"),
                t("performance.quarterLabel3"),
                t("performance.quarterLabel4")
              ]
            }
          });
        }
      }
    );

    onMounted(() => {
      getDeptTree();
      initChart();
      loadChartData();
    });

    onUnmounted(() => {
      if (chart) {
        chart.dispose();
        chart = null;
      }
      window.removeEventListener("resize", handleResize);
    });

    return {
      t,
      chartRef,
      selectedYear,
      selectedDeptId,
      deptOptions,
      yearOptions,
      quarterLabels,
      loadChartData
    };
  }
});
</script>

<style lang="scss" scoped>
.chart-container {
  margin-top: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .filter-container {
      display: flex;
      gap: 10px;
    }
  }

  .chart-wrapper {
    height: 400px;

    .chart {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
