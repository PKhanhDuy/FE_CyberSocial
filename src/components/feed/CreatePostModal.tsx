import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Image, Video, Link as LinkIcon, Hash, Smile, Send, ShieldCheck, Trash2 } from "lucide-react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { useThemeStore } from "@/store/useThemeStore"
import { Button } from "@/components/ui/Button"
import { postApi, uploadApi } from "@/lib/api"
import { useTranslation } from "react-i18next"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
}


export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [media, setMedia] = useState<{ file: File; type: 'image' | 'video'; url: string } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDarkMode = useThemeStore((state) => state.isDarkMode)
  const { t } = useTranslation()

  const onEmojiClick = (emojiObject: any) => {
    setContent((prev) => prev + emojiObject.emoji)
  }
  // Using Nexus Prime as the mock user profile

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    resizeTextarea()
  }

  const resizeTextarea = () => {
    if (textareaRef.current) {
      // No media → max ~4 lines (~96px); with media → max 3 lines (~72px)
      const maxHeight = media ? 72 : 96
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      const url = URL.createObjectURL(file)
      setMedia({ file, type, url })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveMedia = () => {
    if (media?.url) {
      URL.revokeObjectURL(media.url)
    }
    setMedia(null)
  }

  const handlePost = async () => {
    if (!content.trim() && !media) {
      setSubmitError("Vui long nhap noi dung hoac chon anh/video.")
      return
    }

    setIsScanning(true)
    setSubmitError(null)

    // Keep the existing AI scanning UX unchanged; submit after the scan finishes.
    window.setTimeout(async () => {
      try {
        const uploadedMedia = media
          ? media.type === "video"
            ? await uploadApi.video(media.file)
            : await uploadApi.image(media.file)
          : null
        const mediaUrls = uploadedMedia ? [uploadedMedia.url] : []
        await postApi.create(content.trim(), "PUBLIC", mediaUrls)
        window.dispatchEvent(new CustomEvent("cybersocial:post-created"))
        setContent("")
        handleRemoveMedia()
        onClose()
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Khong tao duoc bai viet")
      } finally {
        setIsScanning(false)
      }
    }, 1500)
  }

  const closeAndReset = () => {
    setSubmitError(null)
    setContent("")
    if (media?.url) {
      URL.revokeObjectURL(media.url)
    }
    setMedia(null)
    onClose()
  }

  const handleCancel = () => {
    if (content.trim() || media) {
      setShowCancelConfirm(true)
    } else {
      closeAndReset()
    }
  }

  const confirmCancel = () => {
    setShowCancelConfirm(false)
    closeAndReset()
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden relative shadow-[var(--shadow-neon-pink)] border-border"
            >
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-blue via-accent-pink to-accent-blue opacity-50" />

              {/* Header */}
              <div className="flex items-center justify-center p-4 border-b border-border">
                <h2 className="text-lg font-bold tracking-wider text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-pink shadow-[var(--shadow-neon-pink)] animate-pulse" />
                  {t("post.createPost.title")}
                </h2>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex gap-4">
                  {/* <Avatar src={userProfile.avatar} fallback={userProfile.username} className="w-10 h-10 ring-2 ring-[#00f0ff]/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]" /> */}
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleContentChange}
                      placeholder={t("post.createPost.contentPlaceholder")}
                      className="w-full bg-transparent text-foreground placeholder-text-secondary resize-none outline-none text-lg font-sans py-2"
                      rows={media ? 1 : 10}
                      style={{ minHeight: media ? '0.4rem' : '16rem' }}
                      disabled={isScanning}
                    />

                    {/* Media Preview — only shown when media exists */}
                    {media && (
                      <div className="relative mt-4 rounded-xl overflow-hidden border border-border bg-background w-full group">
                        <div className="max-h-64 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
                          {media.type === 'image' ? (
                            <img src={media.url} alt="Preview" className="w-full h-auto block" />
                          ) : (
                            <video src={media.url} controls className="w-full h-auto block" />
                          )}
                        </div>
                        <button
                          onClick={handleRemoveMedia}
                          className="absolute top-2 right-2 p-2 bg-background/80 hover:bg-accent-pink/20 text-muted hover:text-accent-pink rounded-full backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100 z-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-blue/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                    <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin relative z-10" />
                    <span className="text-accent-blue text-sm font-mono font-bold tracking-wide relative z-10">
                      {t("post.createPost.analyzing")}
                    </span>
                  </motion.div>
                )}

                {submitError && (
                  <div className="mt-4 p-3 rounded-lg bg-danger/10 border border-danger/40 text-sm text-foreground">
                    {submitError}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-panel/80 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => { fileInputRef.current?.setAttribute('accept', 'image/*'); fileInputRef.current?.click() }}
                    className="p-2 text-accent-blue hover:bg-accent-blue/10 rounded-lg transition-colors group relative" title={t("post.createPost.addImage")}
                  >
                    <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.setAttribute('accept', 'video/*'); fileInputRef.current?.click() }}
                    className="p-2 text-accent-pink hover:bg-accent-pink/10 rounded-lg transition-colors group relative" title={t("post.createPost.addVideo")}
                  >
                    <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button className="p-2 text-muted hover:text-foreground hover:bg-panel-hover rounded-lg transition-colors group relative" title={t("post.createPost.attachLink")}>
                    <LinkIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors group relative" title="Emoji"
                    >
                      <Smile className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50 shadow-[var(--shadow-neon-blue)] rounded-lg overflow-hidden border border-border bg-panel">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                          <span className="text-xs font-bold text-muted tracking-wider">{t("post.createPost.emojiLabel")}</span>
                          <button
                            onClick={() => setShowEmojiPicker(false)}
                            className="text-muted hover:text-accent-pink transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <EmojiPicker
                          theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                          onEmojiClick={onEmojiClick}
                          autoFocusSearch={false}
                          width={450}
                          height={320}
                        />
                      </div>
                    )}
                  </div>
                  <button className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors group relative" title={t("post.createPost.addTag")}>
                    <Hash className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <Button
                    className="flex items-center gap-2 px-6 font-bold text-red-500 hover:bg-red-500/10"
                    onClick={handleCancel}
                  >
                    {t("post.createPost.cancel")}
                  </Button>

                  <Button
                    variant={(content.trim() || media) ? "neon-pink" : "default"}
                    onClick={handlePost}
                    disabled={(!content.trim() && !media) || isScanning}
                    className="flex items-center gap-2 px-6 font-bold"
                  >
                    {isScanning ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        {t("post.createPost.verify")}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t("post.createPost.post")}
                      </>
                    )}
                  </Button>
                </div>

              </div>
            </motion.div>
          </motion.div>

          {/* Cancel Confirmation Dialog */}
          <AnimatePresence>
            {showCancelConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/90 backdrop-blur-md z-[60] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="glass-panel w-full max-w-sm rounded-2xl p-6 border-border shadow-[0_0_50px_rgba(255,0,0,0.1)] flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/50">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{t("post.createPost.cancelPost")}</h3>
                  <p className="text-muted mb-6">{t("post.createPost.confirmCancel")}</p>
                  <div className="flex gap-4 w-full">
                    <Button
                      className="flex-1 bg-panel hover:bg-panel-hover text-foreground border border-border"
                      onClick={() => setShowCancelConfirm(false)}
                    >
                      {t("post.createPost.cancel")}
                    </Button>
                    <Button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => {
                        confirmCancel()
                      }}
                    >
                      OK
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
