// MdEditor.tsx
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { EditorHandle } from '@mdeditor/core'
import { MdEditorInner } from './MdEditorInner'
import type { MdEditorProps } from './types'

export const MdEditor = forwardRef<EditorHandle, MdEditorProps>(function MdEditor(props, ref) {
  const {
    defaultValue,
    features,
    toolbar,
    placeholder,
    readOnly = false,
    onChange,
    onChangeDebounce,
    onError,
    onUploadImage,
  } = props

  const [handle, setHandle] = useState<EditorHandle | null>(null)
  useImperativeHandle(ref, () => handle as EditorHandle, [handle])

  // readOnly prop 变化 → handle.setReadOnly（spec §6.1）
  useEffect(() => {
    handle?.setReadOnly(readOnly)
  }, [handle, readOnly])

  // 创建参数只在首渲染取一次（非受控语义；defaultValue/features 变化不重建）
  const options = useMemo(
    () => ({
      ...(defaultValue !== undefined ? { defaultValue } : {}),
      ...(features !== undefined ? { features } : {}),
      ...(onChange !== undefined ? { onChange } : {}),
      ...(onChangeDebounce !== undefined ? { onChangeDebounce } : {}),
      ...(onError !== undefined ? { onError } : {}),
      ...(onUploadImage !== undefined ? { onUploadImage } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="mdeditor-root">
      {/* Task 4 在此插入 <Toolbar>（toolbar?.visible !== false 时） */}
      <div className="mdeditor-body">
        <MdEditorInner options={options} placeholder={placeholder} onReady={setHandle} />
        {/* Task 5/6 在此插入 FloatingToolbar / SlashMenu（handle 就绪后） */}
      </div>
    </div>
  )
})
