import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  useReactFlow,
  Node,
  NodeDoubleClickHandleFunc,
  NodeMouseHandler,
  PaneMouseHandler
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
    // 创建一个新状态来存储被选中节点的ID，初始值为null（未选中）
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 当单击节点时，更新选中的节点ID
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    console.log('方块被单击:', node.id); // 添加日志，用于调试
  }, []);

  // 当单击画布背景时，取消选中
  const onPaneClick: PaneMouseHandler = useCallback(() => {
    setSelectedNodeId(null);
    console.log('背景被单击，取消选中'); // 添加日志，用于调试
  }, []);
  const proOptions = { hideAttribution: false };

  // 2. 告诉 React Flow "我有一个自定义节点类型，叫做 'editable'"
  const nodeTypes = useMemo(() => ({ editable: EditableNode }), []);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 更新特定节点标签的函数
  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.id === nodeId) {
          // 将新数据与旧数据合并，实现更新
          const updatedData = { ...node.data, ...newData };
          return { ...node, data: updatedData };
        }
        return node;
      })
    );
  }, [setNodes]);

  const addNewNode = useCallback(() => {
    const newNodeId = `node_${++nodeId}`;
    const newNode: Node = {
      id: newNodeId,
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      type: 'editable', 
      data: { 
        label: `新文件 ${nodeId}`,
        // 添加一个默认的 code 属性
        code: `// Code for ${newNodeId}\nvoid setup() {\n\n}`,
        // onLabelChange 现在也使用新的更新函数
        onLabelChange: (newLabel: string) => updateNodeData(newNodeId, { label: newLabel, isEditing: false }),
        isEditing: false,
      },
    };
    setNodes((currentNodes) => [...currentNodes, newNode]);
    setTimeout(() => { fitView({ duration: 300, padding: 0.2 }); }, 10);
  }, [setNodes, fitView, updateNodeData]);

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
const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const onGeneratePrompt = () => {
    // --- 新增的调试日志 ---
    console.log('--- 开始生成提示词 ---');
    console.log('当前所有的边 (edges):', edges);
    console.log('当前选中的节点 (selectedNode):', selectedNode);
    // ----------------------

    if (!selectedNode) {
      alert('请先单击选择一个目标方块！');
      return;
    }

    const incomingEdges = edges.filter(edge => edge.target === selectedNode.id);
    
    // --- 新增的调试日志 ---
    console.log('找到的传入边 (incomingEdges):', incomingEdges);
    // ----------------------

    const contextNodeIds = incomingEdges.map(edge => edge.source);
    const contextNodes = nodes.filter(node => contextNodeIds.includes(node.id));

    // ... 后面的字符串拼接逻辑保持不变 ...
    let prompt = "你是一个专业的嵌入式C语言开发工程师。请根据下面提供的上下文代码文件，完成指定的任务。\n\n";
    prompt += "--- 上下文代码文件 ---\n\n";

    if (contextNodes.length > 0) {
      contextNodes.forEach(node => {
        prompt += `// 文件名: ${node.data.label}\n`;
        prompt += `${node.data.code}\n\n`;
      });
    } else {
      prompt += "（无上下文代码文件）\n\n";
    }

    prompt += "--- 任务 ---\n";
    prompt += `请在名为 ${selectedNode.data.label} 的新代码文件中，编写代码以实现以下目标：\n`;
    prompt += `1. [请在这里填写你的具体需求]\n`;
    prompt += `2. [请在这里填写你的具体需求]\n`;
    prompt += "\n请只提供新文件的完整代码，不要解释。";

    alert(prompt);
  };

  return (

    <div className="app-layout">
      {/* 左侧边栏 (不变) */}
      <div className="sidebar">
        <h2>项目文件</h2>
        <button onClick={addNewNode} className="add-node-btn">
          添加方塊
        </button>

         <button onClick={onGeneratePrompt} className="add-node-btn" style={{backgroundColor: '#28a745', marginTop: '10px'}}>
          生成提示词
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
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          proOptions={proOptions}
          nodeTypes={nodeTypes}
          fitView
        />
      </div>

      {/* 新增：右侧属性面板 */}
            <div className="properties-panel">
        {selectedNode ? (
          <div>
            <h3>属性: {selectedNode.data.label}</h3>
            
            <label htmlFor="label">名称 (Label):</label>
            <input
              id="label"
              name="label"
              type="text"
              value={selectedNode.data.label}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            />

            <label htmlFor="code">代码 (Code):</label>
            <textarea
              id="code"
              name="code"
              rows={10}
              value={selectedNode.data.code || ''}
              onChange={(e) => updateNodeData(selectedNode.id, { code: e.target.value })}
            />

          </div>
        ) : (
          <div>
            <h3>属性面板</h3>
            <p>请选择一个方块以查看其属性。</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
