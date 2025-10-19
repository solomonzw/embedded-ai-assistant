# 项目架构与代码分析

本项目是基于 Electron + Vite + React + TypeScript 的桌面应用脚手架，使用 electron-builder 进行打包。渲染进程使用 ReactFlow 构建可视化的「文件节点-依赖边」编辑器，支持新增自定义可编辑节点、连接边、右侧属性面板编辑节点属性，以及基于所选节点的上游依赖生成任务提示词。

## 目录结构

frontend/electron-vite-project/
- electron/
  - main.ts: Electron 主进程入口，创建 BrowserWindow，并处理窗口生命周期。
  - preload.ts: 预加载脚本，通过 contextBridge 安全地向渲染进程暴露有限的 IPC API。
  - electron-env.d.ts: 类型声明，提供 `process.env` 与 `window.ipcRenderer` 的类型。
- src/
  - App.tsx: 渲染进程的核心页面，ReactFlow 画布 + 左侧工具栏 + 右侧属性面板 + 业务逻辑（新增节点、连接、选择、双击编辑、提示词生成）。
  - EditableNode.tsx: 自定义 ReactFlow 节点类型，支持双击进入编辑、失焦或回车确认更名。
  - main.tsx: 应用入口，挂载 ReactDOM 并包裹 ReactFlowProvider。
  - App.css / index.css: 基础样式与布局。
  - PropertiesPanel.tsx: 目前为空（属性面板逻辑在 App.tsx 内联实现）。
- public/: 静态资源（electron-vite.svg 等）。
- dist/、dist-electron/: 构建输出目录（开发/打包后产生）。
- package.json、package-lock.json: 依赖与脚本。
- vite.config.ts: Vite 配置，集成 vite-plugin-electron/simple。
- electron-builder.json5: electron-builder 打包配置。

## 关键技术栈
- Electron 30.x：桌面运行时。
- Vite 5 + React 18 + TypeScript：前端开发体验与类型安全。
- reactflow 11.x：可视化节点图编辑器。
- electron-builder：多平台打包分发（NSIS/DMG/AppImage）。

## 运行与打包
- 开发：在 `frontend/electron-vite-project/` 下执行
  - `npm install`
  - `npm run dev`
  - vite-plugin-electron/simple 会在 Vite 开发服务器启动后构建并启动 Electron 主/预加载进程，主进程通过 `VITE_DEV_SERVER_URL` 加载渲染页。
- 打包：`npm run build`
  - 依次运行 `tsc`、`vite build`、`electron-builder`，产物输出到 `release/${version}`。

## 主进程与预加载
- electron/main.ts
  - 负责创建 BrowserWindow，并在 `did-finish-load` 时通过 `main-process-message` 主动向渲染进程发送一条时间戳消息（目前渲染端未消费该消息）。
  - 开发模式下通过 `VITE_DEV_SERVER_URL` 加载；生产模式从打包后的 `dist/index.html` 加载。
- electron/preload.ts
  - 使用 `contextBridge.exposeInMainWorld('ipcRenderer', { on/off/send/invoke })` 暴露受控的 IPC 能力，避免开启 `nodeIntegration`。
  - 这是一层安全的包装，只暴露必须的 IPC API。

备注：`electron/electron-env.d.ts` 声明了 `window.ipcRenderer: import('electron').IpcRenderer`，而实际暴露的是一个“包装对象”而非原生 IpcRenderer；当前渲染进程未直接使用该变量，因而不会造成运行时错误。若后续要在渲染端使用，建议将类型声明更新为与包装对象一致的接口类型。

## 渲染进程（ReactFlow 编辑器）
- 节点与边状态：
  - `useNodesState`、`useEdgesState` 管理画布节点与边，ReactFlow 推荐用法。
  - `addEdge` 用于连接边；`onConnect` 中直接调用 `setEdges`。
- 自定义节点类型：
  - 在 App.tsx 中 `const nodeTypes = useMemo(() => ({ editable: EditableNode }), [])` 注册自定义节点类型。
  - EditableNode.tsx：
    - 显示/编辑节点名：双击节点切换到编辑态（`isEditing: true`），失焦或回车提交，通过 `data.onLabelChange` 回传给全局状态。
    - 提供顶部 target 与底部 source 连接桩，支持上下游连线。
- 交互逻辑：
  - 左侧“添加方块”按钮：新增 `type: 'editable'` 的节点，随机布局，默认 `label` 与 `code`，并注入 `onLabelChange` 回调。
  - 点击节点：记录 `selectedNodeId`，右侧属性面板显示并可编辑该节点的 `label` 与 `code`。
  - 点击画布空白：取消选中。
  - 双击节点：仅将该节点置为编辑态，其它节点恢复非编辑态。
- 提示词生成：
  - 基于当前选中节点，收集所有“指向它”的上游边（即 `edge.target === selectedNode.id`）。
  - 找到这些边的 `edge.source` 对应的上游节点，将其 `data.code` 作为上下文拼入提示词；最后要求在选中节点（目标文件）内完成任务，实现一种基于依赖关系的代码生成提示场景。

## 配置与质量
- ESLint：`eslint:recommended` + `@typescript-eslint/recommended` + `react-hooks/recommended`，不强制禁用 console。
- TSConfig：`strict: true`，`skipLibCheck: true`，`isolatedModules: true`；包含 `src` 与 `electron` 目录。
- Vite：集成 `vite-plugin-electron/simple` 以在开发时构建并启动主/预加载脚本；生产时单独产出 `dist-electron`。
- electron-builder：跨平台配置（NSIS/DMG/AppImage）已就绪，产物名可通过 `productName` 调整。

## 已做的小修复
- 将 App.tsx 中的类型 `NodeDoubleClickHandleFunc` 更正为 ReactFlow 的 `NodeMouseHandler`，避免因为不存在的类型导出导致 TS 构建/类型检查报错。

## 改进建议（可选）
- 类型统一：
  - 为 ReactFlow 的 Node/Edge 使用带泛型的类型（如 `Node<MyData>`），减少 `any`/隐式类型带来的不确定性。
  - 调整 `electron-env.d.ts` 中 `window.ipcRenderer` 的类型与 preload 暴露的包装对象保持一致，或直接在渲染进程封装一层自定义 API。
- 结构拆分：
  - 将右侧属性面板从 App.tsx 抽离到 `PropertiesPanel.tsx`，便于维护与复用。
- 功能增强：
  - 在节点上展示 code 概要或提示编辑入口；支持更多节点类型（文件/模块/接口等）。
  - 支持导入/导出节点图 JSON，便于持久化与分享。
  - 将“生成提示词”从 `alert` 改为可复制/下载的弹窗或侧边栏，提升可用性。
- IPC 应用：
  - 充分利用 preload 暴露的 IPC，在渲染层保存/读取工程文件、与主进程交互（如文件系统操作）。

以上分析可作为后续迭代与重构的参考。
