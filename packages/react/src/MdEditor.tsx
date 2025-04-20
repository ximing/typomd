// MdEditor.tsx
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { EditorHandle } from '@mdeditor/core'
import { FloatingToolbar } from './FloatingToolbar'
import { MdEditorInner } from './MdEditorInner'
import { SlashMenu } from './SlashMenu'
import { Toolbar } from './Toolbar'
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
      {handle && toolbar?.visible !== false && (
        <Toolbar handle={handle} config={toolbar} hasUpload={onUploadImage !== undefined} />
      )}
      <div className="mdeditor-body">
        <MdEditorInner options={options} placeholder={placeholder} onReady={setHandle} />
        {handle && features?.floatingToolbar !== false && <FloatingToolbar handle={handle} />}
        {handle && <SlashMenu handle={handle} hasUpload={onUploadImage !== undefined} />}
      </div>
    </div>
  )
})
