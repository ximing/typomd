---
'@mdeditor/core': minor
'@mdeditor/theme': minor
---

EditorHandle API 冻结：`getMarkdown / setMarkdown / getJSON / focus / insert / execCommand / setReadOnly / on / destroy`。此后对该 API 面（含 `CreateEditorOptions`、`commandRegistry` 注册项形状）的任何变更必须走 changeset，breaking 变更在描述中标注 BREAKING。
