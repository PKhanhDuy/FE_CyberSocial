import { useCallback, useEffect, useState } from "react"
import { postApi, type PostVerification } from "@/lib/api"

export function usePostVerification(postId: string, totalInteractions: number) {
  const [verification, setVerification] = useState<PostVerification | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const data = await postApi.getVerification(postId)
      console.log("data after prediction", data)
      setVerification(data)
    } catch {
      setVerification(null)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    setIsLoading(true)
    void refetch()
  }, [refetch, totalInteractions])

  useEffect(() => {
    if (!verification) return

    const shouldPoll =
      verification.status === "ANALYZING"
      || (verification.status === "PENDING" && totalInteractions >= verification.nextThreshold && verification.nextThreshold > 0)
      || verification.status === "FAILED"

    if (!shouldPoll) return

    const intervalId = window.setInterval(() => {
      void refetch()
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [verification, totalInteractions, refetch])

  return { verification, isLoading, refetch }
}
