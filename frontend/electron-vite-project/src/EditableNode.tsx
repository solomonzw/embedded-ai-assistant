// src/EditableNode.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// onLabelChange 是一个函数，当标签更新时我们会调用它
// 这个函数会由 App.tsx 传递下来
type NodeData = {
  label: string;
  onLabelChange: (newLabel: string) => void;
  isEditing?: boolean;
};

// 我们自定义的节点组件
function EditableNode({ id, data }: NodeProps<NodeData>) {
  const [inputValue, setInputValue] = useState(data.label);

  // 当外部的 data.label 变化时，同步更新内部的 inputValue
  useEffect(() => {
    setInputValue(data.label);
  }, [data.label]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 当输入框失去焦点时，调用父组件传递的函数来更新全局状态
  const handleInputBlur = () => {
    data.onLabelChange(inputValue);
  };

  // 当在输入框中按下回车键时，同样更新全局状态
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      data.onLabelChange(inputValue);
    }
  };

  return (
    <div style={{ background: '#333', color: 'white', padding: '10px 15px', borderRadius: '5px', border: '1px solid #555' }}>
      {/* 连接点，让节点可以被连接 */}
      <Handle type="target" position={Position.Top} />
      
      {/* 根据 isEditing 的值，决定显示输入框还是文本 */}
      {data.isEditing ? (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoFocus // 自动获取焦点
          style={{ background: '#555', color: 'white', border: '1px solid #777', padding: '2px' }}
        />
      ) : (
        <div>{data.label}</div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default EditableNode;