<template>
  <div class="cost-estimator-container">
    <!-- 头部 -->
    <header class="app-header" ref="headerRef">
      <div class="app-header-inner">
        <h1>
          <el-icon>
            <Histogram />
          </el-icon>
          四川省信息化项目费用测算
          <small>TSCSIA 0015-2025</small>
        </h1>
      </div>
    </header>

    <!-- 主内容：左右布局 -->
    <div class="main-grid">
      <!-- 左栏：输入表单 -->
      <div class="left-panel">
        <!-- 项目基本信息 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Management />
              </el-icon>项目基本信息</div>
          </template>
          <el-form label-position="top" size="default">
            <el-form-item label="项目名称">
              <el-input v-model="project.name" placeholder="请输入项目名称" />
            </el-form-item>
            <el-form-item label="测算阶段">
              <el-select v-model="project.phase" placeholder="选择阶段">
                <el-option label="可研/估算" value="feasibility" />
                <el-option label="初设/概算" value="preliminary" />
                <el-option label="预算/招投标" value="budget" />
                <el-option label="结算/审计" value="settlement" />
              </el-select>
              <div class="def-text">不同阶段影响规模变更因子 CF 和功能点计数方法：
                <br>可研/估算阶段采用预估法（仅 ILF/EIF），CF=1.39；
                <br>初设/概算 & 预算/招投标阶段采用估算法（ILF/EIF/EI/EO/EQ），CF=1.25；
                <br>结算/审计阶段采用预估法（仅 ILF/EIF），CF=1.00。
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 建设费用 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <BrushFilled />
              </el-icon> 建设费用</div>
          </template>

          <!-- 成品软件购置 -->
          <div class="sub-section">
            <div class="sub-title">成品软件购置费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="软件套数">
                    <el-input-number v-model="cost.software.purchase.count" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="单价 (万元/套)">
                    <el-input-number v-model="cost.software.purchase.unitPrice" :min="0" :step="0.5" value-on-clear="min" :precision="1"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ softwarePurchaseTotal.toFixed(2) }}</span> 万元
                </span>
              </div>
            </el-form>
          </div>

          <!-- 定制软件开发（功能点法） -->
          <div class="sub-section">
            <div class="sub-title">定制软件开发费（功能点法）</div>
            <el-form label-position="top" size="default">
              <!-- 数据功能：ILF、EIF -->
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="ILF 数量">
                    <el-input-number v-model="cost.dev.ilf" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="EIF 数量">
                    <el-input-number v-model="cost.dev.eif" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="重用程度">
                    <el-select v-model="cost.dev.reuse" placeholder="选择">
                      <el-option label="低 (1.0)" :value="1.0" />
                      <el-option label="中 (0.67)" :value="0.67" />
                      <el-option label="高 (0.33)" :value="0.33" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <!-- 事务功能：EI、EO、EQ（初设/预算阶段使用） -->
              <el-row :gutter="12" v-if="project.phase !== 'feasibility' && project.phase !== 'settlement'">
                <el-col :span="8">
                  <el-form-item label="EI 数量">
                    <el-input-number v-model="cost.dev.ei" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="EO 数量">
                    <el-input-number v-model="cost.dev.eo" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="EQ 数量">
                    <el-input-number v-model="cost.dev.eq" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <!-- 其他调整因子 -->
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="应用类型调整 ST">
                    <el-select v-model="cost.dev.st" placeholder="选择">
                      <el-option label="业务处理 1.0" :value="1.0" />
                      <el-option label="科技/集成 1.2" :value="1.2" />
                      <el-option label="多媒体 1.3" :value="1.3" />
                      <el-option label="智能信息 1.5" :value="1.5" />
                      <el-option label="系统 1.7" :value="1.7" />
                      <el-option label="通信控制 1.9" :value="1.9" />
                      <el-option label="流程控制 2.0" :value="2.0" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="非功能因子 NF">
                    <el-input-number v-model="cost.dev.nf" :min="0.9" :max="1.1" :step="0.025" value-on-clear="min" :precision="3" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="开发平台 SL">
                    <el-select v-model="cost.dev.sl" placeholder="选择">
                      <el-option label="C/C++ 1.5" :value="1.5" />
                      <el-option label="Python/Go 1.2" :value="1.2" />
                      <el-option label="Java/C# 1.0" :value="1.0" />
                      <el-option label="PHP/JS 0.8" :value="0.8" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="团队背景 DT">
                    <el-select v-model="cost.dev.dt" placeholder="选择">
                      <el-option label="同类经验 0.8" :value="0.8" />
                      <el-option label="相关经验 1.0" :value="1.0" />
                      <el-option label="无经验 1.2" :value="1.2" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="人月单价 (万元/人月)">
                    <el-input-number v-model="cost.dev.rate" :min="0" :step="0.1" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="人月折算 (人时/人月)">
                    <el-input-number v-model="cost.dev.hm" :min="1" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="基准生产率 PDR (P50)">
                    <el-input-number v-model="cost.dev.pdr" :min="0.1" :step="0.1" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  预估 <strong>UFP</strong> = <span class="high-light-text">{{ devUFP.toFixed(0) }}</span> FP
                  &nbsp;|&nbsp; 调整后规模 <strong>S</strong> = <span class="high-light-text">{{ devS.toFixed(0) }}</span> FP
                  &nbsp;|&nbsp; 软件开发费 = <span class="high-light-text">{{ devCost.toFixed(2) }}</span> 万元
                </span>
              </div>
            </el-form>
          </div>

          <!-- 数据建设费 (简略) -->
          <div class="sub-section">
            <div class="sub-title">数据建设费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="数据资源购置 (万元)">
                    <el-input-number v-model="cost.data.purchase" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="数据服务购置 (万元)">
                    <el-input-number v-model="cost.data.service" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="数据资源建库 (万元)">
                    <el-input-number v-model="cost.data.build" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="数据加工 (万元)">
                    <el-input-number v-model="cost.data.process" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ dataTotal.toFixed(2) }}</span> 万元
                </span>
              </div>
            </el-form>
          </div>

          <!-- 系统集成费 -->
          <div class="sub-section">
            <div class="sub-title">系统集成费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="集成对象总费用 (万元)">
                    <el-input-number v-model="cost.integration.base" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="集成费率 (%)">
                    <el-input-number v-model="cost.integration.rate" :min="0" :max="10" :step="0.5" value-on-clear="min" :precision="1"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="调整系数">
                    <el-input-number v-model="cost.integration.adjust" :min="0.6" :max="1.2" :step="0.1" value-on-clear="min" :precision="1"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ integrationCost.toFixed(2) }}</span> 万元
                </span>
              </div>
            </el-form>
          </div>

          <!-- 标准规范编制费 -->
          <div class="sub-section">
            <div class="sub-title">标准规范编制费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="编制工作量 (人月)">
                    <el-input-number v-model="cost.standard.workload" :min="0" :step="0.5" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人月单价 (万元/人月)">
                    <el-input-number v-model="cost.standard.rate" :min="0" :step="0.1" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ standardCost.toFixed(2) }}</span> 万元
                </span>
              </div>
            </el-form>
          </div>

          <!-- 系统迁移费 -->
          <div class="sub-section">
            <div class="sub-title">系统迁移费</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="迁移工作量 (人月)">
                    <el-input-number v-model="cost.migration.workload" :min="0" :step="0.5" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="人月单价 (万元/人月)">
                    <el-input-number v-model="cost.migration.rate" :min="0" :step="0.1" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ migrationCost.toFixed(2) }}</span> 万元
                </span>
              </div>
            </el-form>
          </div>

          <!-- 建设费用汇总 -->
          <div class="total-section">
            <div class="total-label">建设费用合计</div>
            <div class="total-value">{{ constructionTotal.toFixed(2) }} 万元</div>
          </div>
        </el-card>

        <!-- 购买服务费用 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <GoodsFilled />
              </el-icon> 购买服务费用</div>
          </template>
          <div class="sub-section">
            <div class="sub-title">购买信息化产品服务</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="产品单价 (万元)">
                    <el-input-number v-model="cost.service.product.unitPrice" :min="0" :step="0.5" value-on-clear="min" :precision="1"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="数量">
                    <el-input-number v-model="cost.service.product.count" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="折旧年限">
                    <el-input-number v-model="cost.service.product.depreciation" :min="1" :step="1" value-on-clear="min" :precision="0"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="服务期 (年)">
                    <el-input-number v-model="cost.service.product.serviceYears" :min="1" :step="1" value-on-clear="min" :precision="0"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ productServiceCost.toFixed(2) }}</span> 万元/年
                </span>
              </div>
            </el-form>
          </div>

          <div class="sub-section">
            <div class="sub-title">购买信息系统服务</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="建设投资 (万元)">
                    <el-input-number v-model="cost.service.system.investment" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="总运维费 (万元)">
                    <el-input-number v-model="cost.service.system.maintenance" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="经济性系数">
                    <el-input-number v-model="cost.service.system.economy" :min="0" :max="0.5" :step="0.05" value-on-clear="min" :precision="2"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="投资回报率 i (%)">
                    <el-input-number v-model="cost.service.system.roi" :min="0" :max="10" :step="0.5" value-on-clear="min" :precision="1"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="折现率 c (%)">
                    <el-input-number v-model="cost.service.system.discount" :min="0" :max="5" :step="0.1" value-on-clear="min" :precision="2"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="使用期限 N (年)">
                    <el-input-number v-model="cost.service.system.term" :min="1" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <div class="formula-text">
                <span>
                  小计：<span class="high-light-text">{{ systemServiceCost.toFixed(2) }}</span> 万元/年
                </span>
              </div>
            </el-form>
          </div>

          <!-- 购买服务费汇总 -->
          <div class="total-section">
            <div class="total-label">购买服务费合计</div>
            <div class="total-value">{{ purchaseServiceTotal.toFixed(2) }} 万元/年</div>
          </div>
        </el-card>

        <!-- 运维费用 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Tools />
              </el-icon> 运维费用</div>
          </template>
          <div class="sub-section">
            <div class="sub-title">IT 资产系数法</div>
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="机房建设费用 (万元)">
                    <el-input-number v-model="cost.ops.infrastructure.room" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="硬件设备购置费 (万元)">
                    <el-input-number v-model="cost.ops.hardware.purchase" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="软件产品购置费 (万元)">
                    <el-input-number v-model="cost.ops.software.purchase" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="定制软件开发费 (万元)">
                    <el-input-number v-model="cost.ops.software.dev" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="运维费率 (综合 %)">
                    <el-input-number v-model="cost.ops.rate" :min="0" :max="10" :step="0.5" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="规模调整系数">
                    <el-input-number v-model="cost.ops.scaleFactor" :min="0.5" :max="1" :step="0.1" value-on-clear="min" :precision="1"
                      style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <!-- 运维费用汇总 -->
          <div class="total-section">
            <div class="total-label">运维费用合计</div>
            <div class="total-value">{{ opsCost.toFixed(2) }} 万元/年</div>
          </div>
        </el-card>

        <!-- 其他费用与预备费 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <MoreFilled />
              </el-icon> 其他费用 & 预备费</div>
          </template>
          <div class="sub-section">
            <el-form label-position="top" size="default">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="项目建设其他费用 (万元)">
                    <el-input-number v-model="cost.other.managementFee" :min="0" :step="1" value-on-clear="min" :precision="0" style="width:100%;" />
                    <div class="def-text">包括管理费、咨询、监理、测评等</div>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="预备费费率 (%)">
                    <el-input-number v-model="cost.other.contRate" :min="0" :max="5" :step="0.5" value-on-clear="min" :precision="1" style="width:100%;" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>

          <!-- 预备费汇总 -->
          <div class="total-section">
            <div class="total-label">其他费用 & 预备费合计</div>
            <div class="total-value">{{ otherAndContingencyTotal.toFixed(2) }} 万元</div>
          </div>
        </el-card>

        <div class="header-actions">
          <el-button class="opt_btn" size="large" type="primary" @click="loadExample">
            <el-icon>
              <Warning />
            </el-icon><span>示例</span>
          </el-button>
          <el-button class="opt_btn" size="large" @click="resetAll">
            <el-icon>
              <Refresh />
            </el-icon><span>清空</span>
          </el-button>
        </div>
      </div>

      <!-- 右栏：结果汇总与过程 -->
      <div class="right-panel" ref="exportRef">
        <!-- 测算结果 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <Flag />
              </el-icon> 测算结果</div>
          </template>
          <div class="result-block">
            <div class="result-item">
              <span class="label">项目名称</span>
              <span class="value">{{ project.name || '(未命名)' }}</span>
            </div>
            <div class="result-item">
              <span class="label">测算阶段</span>
              <span class="value">{{ phaseLabel }}</span>
            </div>
            <div class="result-item">
              <span class="label">建设费用</span>
              <span class="value">{{ constructionTotal.toFixed(2) }} 万元</span>
            </div>
            <div class="result-item">
              <small class="label"> - 成品软件购置费</small>
              <small class="value">{{ softwarePurchaseTotal.toFixed(2) }} 万元</small>
            </div>
            <div class="result-item">
              <small class="label"> - 定制软件开发费</small>
              <small class="value">{{ devCost.toFixed(2) }} 万元</small>
            </div>
            <div class="result-item">
              <small class="label"> - 数据建设费</small>
              <small class="value">{{ dataTotal.toFixed(2) }} 万元</small>
            </div>
            <div class="result-item">
              <small class="label"> - 系统集成费</small>
              <small class="value">{{ integrationCost.toFixed(2) }} 万元</small>
            </div>
            <div class="result-item">
              <small class="label"> - 标准规范编制费</small>
              <small class="value">{{ standardCost.toFixed(2) }} 万元</small>
            </div>
            <div class="result-item">
              <small class="label"> - 系统迁移费</small>
              <small class="value">{{ migrationCost.toFixed(2) }} 万元</small>
            </div>
            <div class="result-item">
              <span class="label">其他费用</span>
              <span class="value">{{ cost.other.managementFee.toFixed(2) }} 万元</span>
            </div>
            <div class="result-item highlight">
              <span class="label">预备费</span>
              <span class="value">{{ contingencyCost.toFixed(2) }} 万元</span>
            </div>
            <div class="result-item total">
              <span class="label">项目总投资</span>
              <span class="value">{{ totalInvestment.toFixed(2) }} 万元</span>
            </div>
            <div class="result-item">
              <span class="label">购买服务费</span>
              <span class="value">{{ purchaseServiceTotal.toFixed(2) }} 万元/年</span>
            </div>
            <div class="result-item">
              <small class="label"> - 购买信息化产品服务</small>
              <small class="value">{{ productServiceCost.toFixed(2) }} 万元/年</small>
            </div>
            <div class="result-item">
              <small class="label"> - 购买信息系统服务</small>
              <small class="value">{{ systemServiceCost.toFixed(2) }} 万元/年</small>
            </div>
            <div class="result-item">
              <span class="label">运维费用</span>
              <span class="value">{{ opsCost.toFixed(2) }} 万元/年</span>
            </div>
            <div class="result-item total">
              <span class="label">项目年费</span>
              <span class="value">{{ (purchaseServiceTotal + opsCost).toFixed(2) }} 万元/年</span>
            </div>
          </div>
        </el-card>

        <!-- 测算过程 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <TrendCharts />
              </el-icon> 测算过程</div>
          </template>
          <div class="process-step">
            <div class="step">
              <span class="label">① 定制开发软件费（功能点法）</span><br>
              <span class="formula">UFP = {{ devUFPFormula }}</span><br>
              <span class="formula">CF = {{ devCF }}</span><br>
              <span class="formula">S = UFP × CF × 重用 = {{ devS.toFixed(0) }}</span><br>
              <span class="formula">SWF = ST × NF × SL × DT = {{ devSWF.toFixed(3) }}</span><br>
              <span class="formula">工作量 = S × PDR × SWF / HM = {{ devWorkload.toFixed(0) }} 人月</span><br>
              <span class="formula">开发费 = 工作量 × 人月单价 = {{ devCost.toFixed(2) }} 万元</span>
            </div>
            <div class="step">
              <span class="label">② 系统集成费</span><br>
              <span class="formula">集成费 = 集成对象总费用 × 集成费率 × 调整系数</span><br>
              <span class="calc">= {{ cost.integration.base }} × {{ cost.integration.rate }}% × {{
                cost.integration.adjust }}
                = {{ integrationCost.toFixed(2) }} 万元</span>
            </div>
            <div class="step">
              <span class="label">③ 购买信息系统服务费（年均）</span><br>
              <span class="formula">年均费 = (投资+运维) × 经济性系数 × (1+i) / N × Σ(1+c)^n</span><br>
              <span class="calc">= {{ systemServiceCost.toFixed(2) }} 万元</span>
            </div>
            <div class="step">
              <span class="label">④ 预备费</span><br>
              <span class="formula">预备费 = (建设费用 + 其他费用) × 预备费费率</span><br>
              <span class="calc">= ({{ constructionTotal.toFixed(2) }} + {{ cost.other.managementFee }}) × {{
                cost.other.contRate }}% = {{ contingencyCost.toFixed(2) }} 万元</span>
            </div>
          </div>
        </el-card>

        <!-- 新增：测算公式与指标定义 -->
        <el-card class="card" shadow="never">
          <template #header>
            <div class="main-title"><el-icon>
                <QuestionFilled />
              </el-icon>测算公式 &amp; 指标定义</div>
          </template>
          <div class="formula-block">
            <div class="formula-item">
              <div class="formula-title">定制软件开发费（功能点法）</div>
              <div class="formula-content">
                <div>开发费 = 工作量 × 人月单价</div>
                <div>工作量 = S × PDR × SWF / HM</div>
                <div>S = UFP × CF × 重用</div>
                <div>UFP = 35×ILF + 15×EIF （预估法，可研/结算）</div>
                <div>UFP = 10×ILF + 7×EIF + 4×EI + 5×EO + 4×EQ （估算法，初设/预算）</div>
                <div>SWF = ST × NF × SL × DT</div>
              </div>
            </div>
            <div class="formula-item">
              <div class="formula-title">系统集成费</div>
              <div class="formula-content">
                集成费 = 集成对象总费用 × 集成费率 × 调整系数
              </div>
            </div>
            <div class="formula-item">
              <div class="formula-title">购买信息系统服务费（年均）</div>
              <div class="formula-content">
                年均费 = (建设投资 + 总运维费) × 经济性系数 × (1+i) / N × Σ(1+c)^n
              </div>
            </div>
            <div class="formula-item">
              <div class="formula-title">预备费</div>
              <div class="formula-content">
                预备费 = (建设费用 + 其他费用) × 预备费费率
              </div>
            </div>
            <div class="formula-item">
              <div class="formula-title">关键指标定义</div>
              <div class="formula-content">
                <ul>
                  <li><b>ILF</b>：内部逻辑文件</li>
                  <li><b>EIF</b>：外部接口文件</li>
                  <li><b>EI</b>：外部输入</li>
                  <li><b>EO</b>：外部输出</li>
                  <li><b>EQ</b>：外部查询</li>
                  <li><b>CF</b>：规模变更因子（可研1.39，初设/预算1.25，结算1.0）</li>
                  <li><b>ST</b>：应用类型调整因子</li>
                  <li><b>NF</b>：非功能性特征调整因子</li>
                  <li><b>SL</b>：开发平台调整因子</li>
                  <li><b>DT</b>：开发团队背景调整因子</li>
                  <li><b>PDR</b>：基准生产率（人时/FP，参照CSBMK P50）</li>
                </ul>
              </div>
            </div>
          </div>
        </el-card>

        <div class="header-actions">
          <el-button class="opt_btn" size="large" type="success" plain @click="exportCSV">
            <el-icon>
              <Download />
            </el-icon><span>导出表格(csv)</span>
          </el-button>
          <el-button class="opt_btn" size="large" type="primary" plain @click="exportPDF">
            <el-icon>
              <Printer />
            </el-icon><span>导出报告(pdf)</span>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  Histogram, Download, Management, BrushFilled, GoodsFilled, Tools, MoreFilled,
  Flag, TrendCharts, Warning, Refresh, QuestionFilled
} from '@element-plus/icons-vue'
// 金额统一以「整数分」运算，保证「分项之和 === 合计」，且避免 toFixed 对二进制近似值取整出错
import { toNum, toCents, fromCents, mulCents, rateCents, divCents, sumCents } from '../utils/money'
import { buildCsv, safeFileName } from '../utils/csv'

export default {
  // 必须与 router 中的 route.name 一致，否则 <keep-alive :include> 无法命中（标签页缓存失效）
  name: 'SichuanCostEstimator',
  setup() {
    // ---------- ref 引用 ----------
    const headerRef = ref(null)
    const exportRef = ref(null)

    // ---------- 响应式数据 ----------
    const project = ref({
      name: '示例项目',
      phase: 'preliminary'
    })

    const cost = ref({
      software: {
        purchase: { count: 2, unitPrice: 15 }
      },
      dev: {
        ilf: 20,
        eif: 8,
        ei: 0,
        eo: 0,
        eq: 0,
        reuse: 0.67,
        st: 1.0,
        nf: 1.0,
        sl: 1.0,
        dt: 0.8,
        rate: 2.0,
        hm: 174,
        pdr: 6.96   // 基准生产率 P50
      },
      data: {
        purchase: 5,
        service: 3,
        build: 4,
        process: 2
      },
      integration: {
        base: 120,
        rate: 5,
        adjust: 1.0
      },
      standard: {
        workload: 3,
        rate: 2.0
      },
      migration: {
        workload: 4,
        rate: 2.0
      },
      service: {
        product: {
          unitPrice: 8,
          count: 3,
          depreciation: 5,
          serviceYears: 2
        },
        system: {
          investment: 800,
          maintenance: 200,
          economy: 0.5,
          roi: 8,
          discount: 3.65,
          term: 5
        }
      },
      ops: {
        infrastructure: { room: 100 },
        hardware: { purchase: 150 },
        software: { purchase: 50, dev: 300 },
        rate: 6,
        scaleFactor: 0.9
      },
      other: {
        managementFee: 45,
        contRate: 3
      }
    })

    // ---------- 计算属性 ----------
    const cfMap = {
      feasibility: 1.39,
      preliminary: 1.25,
      budget: 1.25,
      settlement: 1.0
    }
    const devCF = computed(() => cfMap[project.value.phase] || 1.25)

    // UFP 根据阶段选择不同计数法
    const devUFP = computed(() => {
      const phase = project.value.phase
      const d = cost.value.dev
      if (phase === 'feasibility' || phase === 'settlement') {
        // 预估法
        return 35 * toNum(d.ilf) + 15 * toNum(d.eif)
      } else {
        // 估算法（初设/预算）
        return 10 * toNum(d.ilf) + 7 * toNum(d.eif) + 4 * toNum(d.ei) + 5 * toNum(d.eo) + 4 * toNum(d.eq)
      }
    })

    // 显示计算公式
    const devUFPFormula = computed(() => {
      const phase = project.value.phase
      const d = cost.value.dev
      if (phase === 'feasibility' || phase === 'settlement') {
        return `35×${d.ilf} + 15×${d.eif} = ${devUFP.value.toFixed(0)}`
      } else {
        return `10×${d.ilf} + 7×${d.eif} + 4×${d.ei} + 5×${d.eo} + 4×${d.eq} = ${devUFP.value.toFixed(0)}`
      }
    })

    const devS = computed(() => {
      // reuse 被清空时若不归一，乘法会静默把整个开发规模变成 0
      return devUFP.value * devCF.value * toNum(cost.value.dev.reuse, 0.67)
    })

    const devSWF = computed(() => {
      return toNum(cost.value.dev.st, 1.0) * toNum(cost.value.dev.nf, 1.0) *
        toNum(cost.value.dev.sl, 1.0) * toNum(cost.value.dev.dt, 0.8)
    })

    const devWorkload = computed(() => {
      const hm = toNum(cost.value.dev.hm, 174)
      if (hm <= 0) return 0
      return (devS.value * toNum(cost.value.dev.pdr, 6.96) * devSWF.value) / hm
    })

    // ==================== 金额计算（整数分） ====================
    // 约定：以「整数分」参与运算，仅在展示/导出处转回万元。
    // 这样可保证「页面展示的分项之和」恰好等于「合计」，且避免 toFixed 对二进制近似值取整出错。

    const softwarePurchaseTotalC = computed(() =>
      mulCents(toCents(cost.value.software.purchase.unitPrice), toNum(cost.value.software.purchase.count)))

    const devCostC = computed(() =>
      mulCents(toCents(devWorkload.value), toNum(cost.value.dev.rate)))

    const dataTotalC = computed(() => {
      const d = cost.value.data
      return sumCents(
        toCents(d.purchase), toCents(d.service), toCents(d.build), toCents(d.process))
    })

    const integrationCostC = computed(() => {
      const it = cost.value.integration
      let cents = rateCents(toCents(it.base), toNum(it.rate, 5))
      cents = mulCents(cents, toNum(it.adjust, 1))
      return cents
    })

    const standardCostC = computed(() =>
      mulCents(toCents(cost.value.standard.workload), toNum(cost.value.standard.rate)))

    const migrationCostC = computed(() =>
      mulCents(toCents(cost.value.migration.workload), toNum(cost.value.migration.rate)))

    // 建设费用合计 = 各分项整数分直接相加（与页面所展示的分项完全自洽）
    const constructionTotalC = computed(() => sumCents(
      softwarePurchaseTotalC.value,
      devCostC.value,
      dataTotalC.value,
      integrationCostC.value,
      standardCostC.value,
      migrationCostC.value
    ))

    // 购买信息化产品服务费（服务期总额，万元）
    const productServiceCostC = computed(() => {
      const p = cost.value.service.product
      const dep = toNum(p.depreciation, 5)
      if (dep <= 0) return 0
      const annual = divCents(mulCents(toCents(p.unitPrice), toNum(p.count)), dep)
      return mulCents(annual, toNum(p.serviceYears, 2))
    })

    // 购买信息系统服务费（年均，万元）
    // 按页面公示公式：年均费 = (投资 + 运维) × 经济性系数 × (1+i) / N × Σ(1+c)^n
    const systemServiceCostC = computed(() => {
      const s = cost.value.service.system
      const term = toNum(s.term, 5)
      if (term <= 0) return 0
      const c = toNum(s.discount) / 100
      const n = Math.max(1, Math.round(term))
      let acc = 0
      for (let k = 1; k <= n; k += 1) acc += Math.pow(1 + c, k)
      const baseCents = mulCents(
        sumCents(toCents(s.investment), toCents(s.maintenance)),
        toNum(s.economy, 0.5)
      )
      const withRoi = mulCents(baseCents, 1 + toNum(s.roi, 8) / 100)
      return Math.round((withRoi / n) * acc)
    })

    const purchaseServiceTotalC = computed(() =>
      sumCents(productServiceCostC.value, systemServiceCostC.value))

    // 运维费（IT资产系数法）
    const opsCostC = computed(() => {
      const ops = cost.value.ops
      const base = toNum(ops.infrastructure.room) * 0.04 +
        toNum(ops.hardware.purchase) * 0.05 +
        toNum(ops.software.purchase) * 0.05 +
        toNum(ops.software.dev) * 0.08
      // 先按四舍五入落到分，再继续乘以系数，避免中间浮点误差累积
      const baseCents = toCents(base)
      const rated = mulCents(baseCents, toNum(ops.rate, 6) / 6)
      return mulCents(rated, toNum(ops.scaleFactor, 0.9))
    })

    const contingencyCostC = computed(() => {
      const baseCents = sumCents(constructionTotalC.value, toCents(cost.value.other.managementFee))
      return rateCents(baseCents, toNum(cost.value.other.contRate, 3))
    })

    const totalInvestmentC = computed(() =>
      sumCents(constructionTotalC.value, toCents(cost.value.other.managementFee), contingencyCostC.value))

    // 其他费用 + 预备费合计（整数分相加，字段被清空为 null 也不会退化为字符串拼接）
    const otherAndContingencyTotalC = computed(() =>
      sumCents(toCents(cost.value.other.managementFee), contingencyCostC.value))

    // ---------- 兼容模板的展示值（万元） ----------
    const softwarePurchaseTotal = computed(() => fromCents(softwarePurchaseTotalC.value))
    const devCost = computed(() => fromCents(devCostC.value))
    const dataTotal = computed(() => fromCents(dataTotalC.value))
    const integrationCost = computed(() => fromCents(integrationCostC.value))
    const standardCost = computed(() => fromCents(standardCostC.value))
    const migrationCost = computed(() => fromCents(migrationCostC.value))
    const constructionTotal = computed(() => fromCents(constructionTotalC.value))
    const productServiceCost = computed(() => fromCents(productServiceCostC.value))
    const systemServiceCost = computed(() => fromCents(systemServiceCostC.value))
    const purchaseServiceTotal = computed(() => fromCents(purchaseServiceTotalC.value))
    const opsCost = computed(() => fromCents(opsCostC.value))
    const contingencyCost = computed(() => fromCents(contingencyCostC.value))
    const totalInvestment = computed(() => fromCents(totalInvestmentC.value))
    const otherAndContingencyTotal = computed(() => fromCents(otherAndContingencyTotalC.value))

    const phaseLabelMap = {
      feasibility: '可研/估算',
      preliminary: '初设/概算',
      budget: '预算/招投标',
      settlement: '结算/审计'
    }
    // 必须是 computed：原先写成一次性赋值，导致切换阶段后标签与导出 CSV 永远停留在初始阶段
    const phaseLabel = computed(() => phaseLabelMap[project.value.phase] || '')

    // ---------- 方法 ----------
    function loadExample() {
      project.value.name = '示例项目'
      project.value.phase = 'preliminary'
      cost.value.software.purchase.count = 3
      cost.value.software.purchase.unitPrice = 12
      cost.value.dev.ilf = 30
      cost.value.dev.eif = 12
      cost.value.dev.ei = 20
      cost.value.dev.eo = 8
      cost.value.dev.eq = 10
      cost.value.dev.reuse = 0.67
      cost.value.dev.st = 1.0
      cost.value.dev.nf = 1.0
      cost.value.dev.sl = 1.0
      cost.value.dev.dt = 0.8
      cost.value.dev.rate = 2.0
      cost.value.dev.hm = 174
      cost.value.dev.pdr = 6.96
      cost.value.data.purchase = 8
      cost.value.data.service = 5
      cost.value.data.build = 6
      cost.value.data.process = 3
      cost.value.integration.base = 200
      cost.value.integration.rate = 5
      cost.value.integration.adjust = 1.0
      cost.value.standard.workload = 4
      cost.value.standard.rate = 2.0
      cost.value.migration.workload = 5
      cost.value.migration.rate = 2.0
      cost.value.service.product.unitPrice = 10
      cost.value.service.product.count = 4
      cost.value.service.product.depreciation = 5
      cost.value.service.product.serviceYears = 3
      cost.value.service.system.investment = 1200
      cost.value.service.system.maintenance = 300
      cost.value.service.system.economy = 0.5
      cost.value.service.system.roi = 8
      cost.value.service.system.discount = 3.65
      cost.value.service.system.term = 5
      cost.value.ops.infrastructure.room = 150
      cost.value.ops.hardware.purchase = 200
      cost.value.ops.software.purchase = 80
      cost.value.ops.software.dev = 400
      cost.value.ops.rate = 6
      cost.value.ops.scaleFactor = 0.9
      cost.value.other.managementFee = 60
      cost.value.other.contRate = 3
      ElMessage.success('示例数据已加载')
    }

    function resetAll() {
      project.value.name = ''
      project.value.phase = 'preliminary'
      cost.value.software.purchase.count = 0
      cost.value.software.purchase.unitPrice = 0
      cost.value.dev.ilf = 0
      cost.value.dev.eif = 0
      cost.value.dev.ei = 0
      cost.value.dev.eo = 0
      cost.value.dev.eq = 0
      cost.value.dev.reuse = 0.67
      cost.value.dev.st = 1.0
      cost.value.dev.nf = 1.0
      cost.value.dev.sl = 1.0
      cost.value.dev.dt = 0.8
      cost.value.dev.rate = 2.0
      cost.value.dev.hm = 174
      cost.value.dev.pdr = 6.96
      cost.value.data.purchase = 0
      cost.value.data.service = 0
      cost.value.data.build = 0
      cost.value.data.process = 0
      cost.value.integration.base = 0
      cost.value.integration.rate = 5
      cost.value.integration.adjust = 1.0
      cost.value.standard.workload = 0
      cost.value.standard.rate = 2.0
      cost.value.migration.workload = 0
      cost.value.migration.rate = 2.0
      cost.value.service.product.unitPrice = 0
      cost.value.service.product.count = 0
      cost.value.service.product.depreciation = 5
      cost.value.service.product.serviceYears = 1
      cost.value.service.system.investment = 0
      cost.value.service.system.maintenance = 0
      cost.value.service.system.economy = 0.5
      cost.value.service.system.roi = 8
      cost.value.service.system.discount = 3.65
      cost.value.service.system.term = 1
      cost.value.ops.infrastructure.room = 0
      cost.value.ops.hardware.purchase = 0
      cost.value.ops.software.purchase = 0
      cost.value.ops.software.dev = 0
      cost.value.ops.rate = 6
      cost.value.ops.scaleFactor = 1.0
      cost.value.other.managementFee = 0
      cost.value.other.contRate = 3
      ElMessage.success('已清空所有数据')
    }

    // ---------- 导出 CSV ----------
    function exportCSV() {
      const rows = [
        ['===== 项目信息 =====', ''],
        ['项目名称', project.value.name],
        ['测算阶段', phaseLabel.value || project.value.phase],
        [''],
        ['===== 建设费用 =====', ''],
        ['--- 成品软件购置 ---', ''],
        ['软件套数', cost.value.software.purchase.count],
        ['单价 (万元/套)', cost.value.software.purchase.unitPrice],
        ['小计 (万元)', softwarePurchaseTotal.value.toFixed(2)],
        [''],
        ['--- 定制软件开发费（功能点法）---', ''],
        ['ILF 数量', cost.value.dev.ilf],
        ['EIF 数量', cost.value.dev.eif],
        ['EI 数量', cost.value.dev.ei],
        ['EO 数量', cost.value.dev.eo],
        ['EQ 数量', cost.value.dev.eq],
        ['重用程度', cost.value.dev.reuse],
        ['应用类型调整 ST', cost.value.dev.st],
        ['非功能因子 NF', cost.value.dev.nf],
        ['开发平台 SL', cost.value.dev.sl],
        ['团队背景 DT', cost.value.dev.dt],
        ['人月单价 (万元/人月)', cost.value.dev.rate],
        ['人月折算 (人时/人月)', cost.value.dev.hm],
        ['基准生产率 PDR', cost.value.dev.pdr],
        ['UFP (未调整)', devUFP.value.toFixed(0)],
        ['调整后规模 (FP)', devS.value.toFixed(0)],
        ['软件开发费 (万元)', devCost.value.toFixed(2)],
        [''],
        ['--- 数据建设费 ---', ''],
        ['数据资源购置 (万元)', cost.value.data.purchase],
        ['数据服务购置 (万元)', cost.value.data.service],
        ['数据资源建库 (万元)', cost.value.data.build],
        ['数据加工 (万元)', cost.value.data.process],
        ['数据建设费合计 (万元)', dataTotal.value.toFixed(2)],
        [''],
        ['--- 系统集成费 ---', ''],
        ['集成对象总费用 (万元)', cost.value.integration.base],
        ['集成费率 (%)', cost.value.integration.rate],
        ['调整系数', cost.value.integration.adjust],
        ['系统集成费 (万元)', integrationCost.value.toFixed(2)],
        [''],
        ['--- 标准规范编制费 ---', ''],
        ['编制工作量 (人月)', cost.value.standard.workload],
        ['人月单价 (万元/人月)', cost.value.standard.rate],
        ['标准规范编制费 (万元)', standardCost.value.toFixed(2)],
        [''],
        ['--- 系统迁移费 ---', ''],
        ['迁移工作量 (人月)', cost.value.migration.workload],
        ['人月单价 (万元/人月)', cost.value.migration.rate],
        ['系统迁移费 (万元)', migrationCost.value.toFixed(2)],
        [''],
        ['建设费用合计 (万元)', constructionTotal.value.toFixed(2)],
        [''],
        ['===== 购买服务费用 =====', ''],
        ['--- 购买信息化产品服务 ---', ''],
        ['产品单价 (万元)', cost.value.service.product.unitPrice],
        ['数量', cost.value.service.product.count],
        ['折旧年限', cost.value.service.product.depreciation],
        ['服务期 (年)', cost.value.service.product.serviceYears],
        ['购买产品服务费 (万元)', productServiceCost.value.toFixed(2)],
        [''],
        ['--- 购买信息系统服务 ---', ''],
        ['建设投资 (万元)', cost.value.service.system.investment],
        ['总运维费 (万元)', cost.value.service.system.maintenance],
        ['经济性系数', cost.value.service.system.economy],
        ['投资回报率 i (%)', cost.value.service.system.roi],
        ['折现率 c (%)', cost.value.service.system.discount],
        ['使用期限 N (年)', cost.value.service.system.term],
        ['信息系统服务年均费 (万元)', systemServiceCost.value.toFixed(2)],
        [],
        ['购买服务费合计 (万元)', purchaseServiceTotal.value.toFixed(2)],
        [],
        ['===== 运维费用 =====', ''],
        ['--- IT 资产系数法 ---', ''],
        ['机房建设费用 (万元)', cost.value.ops.infrastructure.room],
        ['硬件设备购置费 (万元)', cost.value.ops.hardware.purchase],
        ['软件产品购置费 (万元)', cost.value.ops.software.purchase],
        ['定制软件开发费 (万元)', cost.value.ops.software.dev],
        ['综合运维费率 (%)', cost.value.ops.rate],
        ['规模调整系数', cost.value.ops.scaleFactor],
        ['运维年费 (万元)', opsCost.value.toFixed(2)],
        [],
        ['===== 其他费用 & 预备费 =====', ''],
        ['项目建设其他费用 (万元)', cost.value.other.managementFee],
        ['预备费费率 (%)', cost.value.other.contRate],
        ['预备费 (万元)', contingencyCost.value.toFixed(2)],
        [],
        ['===== 项目总投资 =====', ''],
        ['项目总投资 (万元)', totalInvestment.value.toFixed(2)],
      ]

      // 统一走 buildCsv：转义逗号/引号/换行，并阻断 = + - @ 开头的公式注入（CWE-1236）
      const csv = buildCsv(rows)

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `费用测算表_${safeFileName(project.value.name, '项目')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // 立即 revoke 会导致部分浏览器中断下载，延迟释放
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    // ---------- 导出 PDF ----------
    async function exportPDF() {
      try {
        const headerEl = headerRef.value
        const exportEl = exportRef.value
        if (!headerEl || !exportEl) {
          ElMessage.error('未找到需要导出的组件，请确保页面已完整渲染。')
          return
        }

        const capture = (el) => html2canvas(el, {
          useCORS: true,
          scale: 2,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
        })

        const [headerCanvas, exportCanvas] = await Promise.all([
          capture(headerEl),
          capture(exportEl)
        ])

        const targetWidthPx = 1600

        const resizeCanvas = (canvas, targetWidth) => {
          const scale = targetWidth / canvas.width
          const newCanvas = document.createElement('canvas')
          newCanvas.width = targetWidth
          newCanvas.height = canvas.height * scale
          const ctx = newCanvas.getContext('2d')
          ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height)
          return newCanvas
        }

        const resizedHeader = resizeCanvas(headerCanvas, targetWidthPx)
        const resizedExport = resizeCanvas(exportCanvas, targetWidthPx)

        const totalHeight = resizedHeader.height + resizedExport.height
        const mergedCanvas = document.createElement('canvas')
        mergedCanvas.width = targetWidthPx
        mergedCanvas.height = totalHeight
        const ctx = mergedCanvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetWidthPx, totalHeight)
        ctx.drawImage(resizedHeader, 0, 0)
        ctx.drawImage(resizedExport, 0, resizedHeader.height)

        const pdf = new jsPDF('p', 'mm', 'a4')
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const imgWidth = mergedCanvas.width
        const imgHeight = mergedCanvas.height
        const scale = pageWidth / imgWidth
        const displayWidth = pageWidth
        const displayHeight = imgHeight * scale

        if (displayHeight <= pageHeight) {
          const imgData = mergedCanvas.toDataURL('image/png')
          const x = 0
          const y = (pageHeight - displayHeight) / 2
          pdf.addImage(imgData, 'PNG', x, y, displayWidth, displayHeight)
        } else {
          const pixelsPerPage = pageHeight / scale
          let startY = 0
          let pageNum = 0
          while (startY < imgHeight) {
            const endY = Math.min(startY + pixelsPerPage, imgHeight)
            const pageCanvas = document.createElement('canvas')
            pageCanvas.width = imgWidth
            pageCanvas.height = endY - startY
            const pageCtx = pageCanvas.getContext('2d')
            pageCtx.drawImage(mergedCanvas, 0, startY, imgWidth, endY - startY, 0, 0, imgWidth, endY - startY)

            const imgData = pageCanvas.toDataURL('image/png')
            const pageDisplayHeight = (endY - startY) * scale
            const x = 0
            const y = (pageHeight - pageDisplayHeight) / 2
            if (pageNum > 0) pdf.addPage()
            pdf.addImage(imgData, 'PNG', x, y, displayWidth, pageDisplayHeight)

            startY = endY
            pageNum++
          }
        }

        pdf.save(`费用测算报告_${project.value.name || '项目'}.pdf`)
        ElMessage.success('PDF导出成功')
      } catch (error) {
        ElMessage.error('PDF导出失败，请查看控制台错误信息。')
      }
    }

    return {
      headerRef,
      exportRef,
      project,
      cost,
      phaseLabel,
      softwarePurchaseTotal,
      devUFP,
      devUFPFormula,
      devCF,
      devS,
      devSWF,
      devWorkload,
      devCost,
      dataTotal,
      integrationCost,
      standardCost,
      migrationCost,
      constructionTotal,
      productServiceCost,
      systemServiceCost,
      purchaseServiceTotal,
      opsCost,
      contingencyCost,
      totalInvestment,
      otherAndContingencyTotal,
      loadExample,
      resetAll,
      exportCSV,
      exportPDF
    }
  }
}
</script>

<style scoped lang="scss">
.cost-estimator-container {
  font-family: 'Segoe UI', 'PingFang SC', Roboto, 'Helvetica Neue', sans-serif;
  color: #2c3e50;
  max-width: 2000px;
  margin: 0 auto;
}

/* 移动端适配等 */
@media (max-width: 768px) {
  .cost-estimator-container {
    padding: 0 6px;
  }

  .app-header {
    padding: 16px 20px;
  }

  .app-header-inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  .app-header h1 {
    font-size: 22px;
    flex-wrap: wrap;
  }

  .app-header h1 small {
    font-size: 14px;
    margin-left: 0;
    display: block;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .opt_btn {
    flex: 1;
    min-width: 120px;
    gap: 8px;
  }

  .main-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .result-grid {
    grid-template-columns: 1fr 1fr;
  }

  .el-card {
    margin-bottom: 12px;
  }

  .main-title {
    gap: 8px;
    display: flex;
    align-items: center;
    font-size: 16px;
    color: #1a3a5c;
  }

  .sub-title {
    gap: 8px;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #1a3a5c;
    margin: 8px 0 8px 0;
  }

  .def-text {
    font-size: 12px;
    color: #6a7a8a;
  }

  .formula-text {
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px 16px;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    font-size: 14px;
    gap: 8px;
  }

  .high-light-text {
    color: #c0392b;
    font-weight: 700;
  }

  .el-input-number {
    width: 100% !important;
  }

  .el-col {
    padding: 0 4px;
  }
}

.app-header {
  background: linear-gradient(135deg, #1a3a5c, #2a5f8f);
  color: #fff;
  padding: 24px 28px;
  border-radius: 16px;
  margin-top: 5px;
  margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(26, 58, 92, 0.25);
}

.app-header-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.app-header h1 {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header h1 small {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.8;
  margin-left: 12px;
}

.app-header .sub {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.85;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.app-header .sub .badge {
  background: rgba(255, 255, 255, 0.18);
  padding: 2px 14px;
  border-radius: 20px;
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.opt_btn {
  flex: 1;
  min-width: 120px;
  gap: 8px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  margin-bottom: 0;
}

.card :deep(.el-card__header) {
  padding: 14px 18px;
  border-bottom: 2px solid #eef2f7;
}

.main-title {
  gap: 8px;
  display: inline-flex;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
  color: #1a3a5c;
}

.main-title .icon {
  font-size: 20px;
  color: #1a3a5c;
}

.sub-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #eaeef3;
}

.sub-section:last-child {
  border-bottom: none;
}

.sub-title {
  gap: 8px;
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
  color: #1a3a5c;
  margin: 8px 0 8px 0;
}

.total-section {
  background: #f0f4fa;
  border-radius: 8px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.total-label {
  font-weight: 600;
  font-size: 16px;
  color: #1a3a5c;
}

.total-value {
  font-size: 20px;
  font-weight: 700;
  color: #c0392b;
}

.result-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f0f2f5;
}

.result-item .label {
  color: #6a7a8a;
  font-weight: 500;
}

.result-item .value {
  font-weight: 600;
  color: #2c3e50;
}

.result-item.highlight .value {
  color: #e67e22;
}

.result-item.total .value {
  font-size: 20px;
  color: #c0392b;
}

.process-step {
  font-size: 14px;
  line-height: 2;
}

.step {
  padding: 6px 0;
  border-bottom: 1px dashed #eaeef3;
}

.step .label {
  font-weight: 600;
  color: #1a3a5c;
}

.step .formula {
  color: #4a5b6e;
  font-family: 'Courier New', monospace;
  background: #f0f4fa;
  padding: 0 6px;
  border-radius: 4px;
  display: inline-block;
}

.step .calc {
  color: #2c3e50;
  padding-left: 12px;
  display: block;
  font-size: 12px;
  word-break: break-all;
}

.formula-block {
  background: #f0f4fa;
  border-radius: 10px;
  padding: 14px 18px;
  margin: 8px 0;
  font-size: 14px;
  line-height: 2;
  border-left: 4px solid #2a5f8f;
}

.formula-block .math {
  font-family: 'Courier New', monospace;
  background: #e8edf4;
  padding: 2px 10px;
  border-radius: 4px;
  display: inline-block;
  font-weight: 600;
  color: #1a3a5c;
}

.formula-block .def {
  color: #4a5b6e;
}

.formula-block .formula-item {
  margin-bottom: 14px;
}

.formula-block .formula-item:last-child {
  margin-bottom: 0;
}

.formula-block .formula-title {
  font-weight: 600;
  color: #1a3a5c;
  margin-bottom: 4px;
  font-size: 14px;
}

.formula-block .formula-content {
  font-size: 13px;
  color: #2c3e50;
  padding-left: 12px;
  line-height: 1.8;
}

.formula-block ul {
  margin: 4px 0;
  padding-left: 20px;
}

.formula-block ul li {
  list-style: disc;
  line-height: 1.6;
}

.def-text {
  font-size: 12px;
  color: #6a7a8a;
  margin-bottom: 8px;
  line-height: 1.6;
}

.formula-text {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  font-size: 14px;
  gap: 8px;
}

.high-light-text {
  color: #c0392b;
  font-weight: 700;
}

.el-form-item {
  margin-bottom: 8px;
}

/* 打印样式 */
@media print {
  .cost-estimator-container {
    height: auto !important;
    overflow: visible !important;
  }

  .main-grid {
    display: block !important;
  }

  .app-header {
    background: #1a3a5c !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .el-button,
  .el-card__header .el-button {
    display: none !important;
  }

  .card {
    break-inside: avoid;
    box-shadow: none !important;
  }

  .main-grid>div {
    width: 100%;
  }

  .result-item {
    border-left-color: #2a5f8f !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .process-step .step .formula,
  .formula-block {
    background: #f0f4fa !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cost-estimator-container,
  .main-grid,
  .el-card,
  .process-step,
  .formula-block {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
}
</style>