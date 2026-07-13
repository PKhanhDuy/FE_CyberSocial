import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { aiConfigApi, aiMonitoringApi } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import { PageHeader, AdminCard, StatTile } from "@/components/admin/AdminBits"

export function AdminAiMonitoring() {
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ["ai-monitoring-stats"],
    queryFn: () => aiMonitoringApi.getStats(),
    refetchInterval: 5000,
  })
  const { data: pending = [] } = useQuery({
    queryKey: ["ai-monitoring-pending", 10],
    queryFn: () => aiMonitoringApi.getPendingScan(10),
    refetchInterval: 5000,
  })
  const { data: config } = useQuery({ queryKey: ["ai-config"], queryFn: () => aiConfigApi.get() })

  const [enabled, setEnabled] = useState(true)
  const [thresholds, setThresholds] = useState("5,15,30")
  const [debounce, setDebounce] = useState(3)
  const [fakePercent, setFakePercent] = useState(59)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled)
      setThresholds(config.tierThresholds.join(","))
      setDebounce(config.debounceMinutes)
      setFakePercent(config.fakeThresholdPercent)
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: () =>
      aiConfigApi.update({
        enabled,
        tierThresholds: thresholds
          .split(",")
          .map((value) => parseInt(value.trim(), 10))
          .filter((value) => Number.isFinite(value) && value > 0),
        debounceMinutes: debounce,
        fakeThresholdPercent: fakePercent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-config"] })
      setMessage({ ok: true, text: "Đã áp dụng cấu hình." })
    },
    onError: (err) =>
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Lưu cấu hình thất bại." }),
  })

  return (
    <div>
      <PageHeader
        title="Giám sát AI"
        description="Hiệu suất mô-đun TGNN, hàng đợi chờ đạt ngưỡng phân tích, và cấu hình runtime."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile accent label="Điểm tin cậy TB" value={<>{(stats?.averageTrustScore ?? 0).toFixed(1)}<span className="text-lg text-muted">%</span></>} sub="averageTrustScore" />
        <StatTile label="Tỷ lệ tin giả" value={<>{(stats?.fakeDetectionRate ?? 0).toFixed(1)}<span className="text-lg text-muted">%</span></>} sub="fakeDetectionRate" />
        <StatTile label="Đã kiểm chứng" value={(stats?.verifiedPostCount ?? 0).toLocaleString()} sub="verifiedPostCount" />
        <StatTile label="Gắn nhãn FAKE" value={<span className="text-danger">{(stats?.fakePostCount ?? 0).toLocaleString()}</span>} sub="fakePostCount" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Hàng đợi chờ quét</h3>
              <p className="text-xs text-muted">bài sắp đạt ngưỡng phân tích</p>
            </div>
          </div>
          <div className="p-4">
            {pending.length === 0 && <div className="py-6 text-center text-sm text-muted">Không có bài chờ quét.</div>}
            {pending.map((item) => {
              const pct = item.nextThreshold > 0 ? Math.min(100, (item.totalInteractions / item.nextThreshold) * 100) : 100
              return (
                <div key={item.postId} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                  <span className="flex-none rounded-md bg-accent-blue/10 px-2 py-1 font-mono text-xs text-accent-blue">
                    {item.nodeId}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{item.contentPreview || "(không có nội dung)"}</div>
                    <div className="text-xs text-muted">
                      {item.authorDisplayName} · mốc tiếp theo tại {item.nextThreshold}
                    </div>
                  </div>
                  <div className="flex-none text-right">
                    <div className="font-mono text-sm font-bold text-foreground">
                      {item.totalInteractions}
                      <span className="text-muted">/{item.nextThreshold}</span>
                    </div>
                    <div className="mt-1 h-1 w-24 overflow-hidden rounded bg-border">
                      <div className="h-full rounded bg-accent-blue" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard>
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Cấu hình mô hình</h3>
          </div>
          <div className="space-y-5 p-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Bật phân tích tự động</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent-blue)]"
              />
            </label>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Ngưỡng gắn nhãn FAKE</label>
                <span className="font-mono text-sm font-bold text-accent-blue">{fakePercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={fakePercent}
                onChange={(event) => setFakePercent(Number(event.target.value))}
                className="mt-2 w-full accent-[var(--color-accent-blue)]"
              />
              <p className="mt-1 text-xs text-muted">Hiển thị cho admin; ngưỡng thực thi nằm ở AI service.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Các mốc tương tác (tier)</label>
              <input
                value={thresholds}
                onChange={(event) => setThresholds(event.target.value)}
                placeholder="5,15,30"
                className="w-full rounded-lg border border-border bg-panel px-3 py-2 font-mono text-sm text-foreground focus:border-accent-blue focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">Danh sách số nguyên dương, cách nhau bằng dấu phẩy.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Chu kỳ chống dội (phút)</label>
              <input
                type="number"
                min={1}
                value={debounce}
                onChange={(event) => setDebounce(Number(event.target.value))}
                className="w-28 rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-accent-blue focus:outline-none"
              />
            </div>

            {message && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="neon-blue" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                {saveMutation.isPending ? "Đang lưu…" : "Áp dụng cấu hình"}
              </Button>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
