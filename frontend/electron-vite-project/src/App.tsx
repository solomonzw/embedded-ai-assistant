import { useCallback, useMemo } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
  Node,
  NodeDoubleClickHandleFunc,
} from 'reactflow';

// 1. 导入我们的自定义节点组件
import EditableNode from './EditableNode';

import 'reactflow/dist/style.css';
import './App.css';

let nodeId = 0;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const proOptions = { hideAttribution: false };

  // 2. 告诉 React Flow "我有一个自定义节点类型，叫做 'editable'"
  const nodeTypes = useMemo(() => ({ editable: EditableNode }), []);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 更新特定节点标签的函数
  const updateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel, isEditing: false } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const addNewNode = useCallback(() => {
    nodeId++;
    const newNode: Node = {
      id: `node_${nodeId}`,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      // 3. 创建新节点时，指定它的类型为 'editable'
      type: 'editable', 
      data: { 
        label: `新文件 ${nodeId}`,
        // 传递更新函数和初始编辑状态
        onLabelChange: (newLabel: string) => updateNodeLabel(`node_${nodeId}`, newLabel),
        isEditing: false,
      },
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
    setTimeout(() => { fitView({ duration: 300, padding: 0.2 }); }, 10);
  }, [setNodes, fitView, updateNodeLabel]);

  // 4. 双击时，不再弹窗，而是切换节点的 isEditing 状态
  const onNodeDoubleClick: NodeDoubleClickHandleFunc = useCallback((event, clickedNode) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === clickedNode.id) {
          return { ...node, data: { ...node.data, isEditing: true } };
        }
        return { ...node, data: { ...node.data, isEditing: false } }; // 取消其他节点的编辑状态
      })
    );
  }, [setNodes]);

// 在 App.tsx 中

  return (
    <div className="app-layout">
      {/* 左侧边栏 (不变) */}
      <div className="sidebar">
        <h2>项目文件</h2>
        <button onClick={addNewNode} className="add-node-btn">
          添加方塊
        </button>
      </div>

      {/* 中心画布容器 (不变) */}
      <div className="canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          proOptions={proOptions}
          nodeTypes={nodeTypes}
          fitView
        />
      </div>

      {/* 新增：右侧属性面板 */}
      <div className="properties-panel">
        <h3>属性</h3>
        <p>在这里编辑被选中方块的属性</p>
      </div>
    </div>
  );
}

export default App;
