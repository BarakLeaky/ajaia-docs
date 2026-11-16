"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ShareDialog from "./ShareDialog";

type Status = "saved" | "saving" | "dirty" | "error";

export default function Editor(props: {
  docId: string;
  initialTitle: string;
  initialHtml: string;
  role: "owner" | "editor" | "viewer";
  editable: boolean;
}) {
  const { docId, role, editable } = props;
  const [title, setTitle] = useState(props.initialTitle);
  const [status, setStatus] = useState<Status>("saved");
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  titleRef.current = title;

  const editor = useEditor({
    extensions: [StarterKit],
    content: props.initialHtml,
    editable,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: () => schedule(),
  });

  const save = useCallback(async () => {
    if (!editor || !editable) return;
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleRef.current, contentHtml: editor.getHTML() }),
      });
      if (!res.ok) {
        setMessage((await res.json().catch(() => ({}))).error ?? "Save failed.");
        setStatus("error");
        return;
      }
      setStatus("saved");
    } catch {
      setMessage("Network error. Your changes are not saved yet.");
      setStatus("error");
    }
  }, [editor, editable, docId]);

  function schedule() {
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(), 800);
  }

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (status !== "dirty" && status !== "saving") return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  const statusText =
    status === "saving" ? "Saving…" : status === "dirty" ? "Unsaved changes" : status === "error" ? message : "All changes saved";

  const btn = (label: string, active: boolean, run: () => void, aria: string) => (
    <button
      type="button"
      className={active ? "on" : ""}
      aria-label={aria}
      aria-pressed={active}
      disabled={!editable}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  return (
    <div className="editor-wrap">
      <div className="editor-head">
        <input
          className="title-input"
          type="text"
          value={title}
          disabled={!editable}
          maxLength={200}
          aria-label="Document title"
          onChange={(e) => { setTitle(e.target.value); schedule(); }}
        />
        <span className={`badge ${role === "owner" ? "" : "shared"}`}>
          {role === "owner" ? "Owner" : role === "editor" ? "Can edit" : "View only"}
        </span>
        {role === "owner" && <button onClick={() => setSharing(true)}>Share</button>}
        {editable && <button className="primary" onClick={save} disabled={status === "saving"}>Save</button>}
        <span className={`status ${status === "error" ? "bad" : ""}`} role="status">{editable ? statusText : "Read only"}</span>
      </div>

      {editor && (
        <div className="toolbar" role="toolbar" aria-label="Formatting">
          {btn("B", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold")}
          {btn("I", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic")}
          {btn("U", editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Underline")}
          {btn("H1", editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "Heading 1")}
          {btn("H2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Heading 2")}
          {btn("• List", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bulleted list")}
          {btn("1. List", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list")}
        </div>
      )}
      <div className={`sheet ${editable ? "" : "readonly"}`}>
        <EditorContent editor={editor} />
      </div>

      {sharing && <ShareDialog docId={docId} onClose={() => setSharing(false)} />}
    </div>
  );
}
