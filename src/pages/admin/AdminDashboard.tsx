import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { adminApi } from "@/lib/api"
import { PageHeader, StatTile, AdminCard, StatusPill } from "@/components/admin/AdminBits"

const flow = [
  { to: "/admin/users", label: "Quản lý người dùng" },
  { to: "/admin/posts", label: "Quản lý bài viết" },
  { to: "/admin/ai", label: "Giám sát AI" },
  { to: "/admin/fake", label: "Giám sát tin giả" },
]

// Bảng màu ngữ nghĩa (đã kiểm định CVD): xanh = thật/tốt, xám = trung tính, đỏ = giả/khóa.
const C = {
  good: "var(--color-success)",
  neutral: "var(--color-muted)",
  bad: "var(--color-danger)",
  accent: "var(--color-accent-blue)",
  track: "var(--color-border)",
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: { name?: string } }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  const label = p.name ?? p.payload?.name ?? ""
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-foreground">{label}</div>
      <div className="font-mono text-muted">{(p.value ?? 0).toLocaleString()}</div>
    </div>
  )
}

function Donut({
  data,
  center,
  centerLabel,
}: {
  data: Array<{ name: string; value: number; color: string }>
  center: string
  centerLabel: string
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-2xl font-bold tabular-nums text-foreground">{center}</div>
        <div className="text-xs text-muted">{centerLabel}</div>
      </div>
    </div>
  )
}

function Legend({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  return (
    <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
          <span className="text-muted">{d.name}</span>
          <span className="font-mono font-semibold text-foreground">{d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminApi.getStats() })
  const ai = stats?.aiStats

  const trust = ai?.averageTrustScore ?? 0
  const trustColor = trust >= 75 ? C.good : trust >= 45 ? C.accent : C.bad

  const verified = ai?.verifiedPostCount ?? 0
  const fake = ai?.fakePostCount ?? 0
  const totalPosts = stats?.totalPosts ?? 0
  const contentData = [
    { name: "Tin thật", value: Math.max(0, verified - fake), color: C.good },
    { name: "Chưa phân tích", value: Math.max(0, totalPosts - verified), color: C.neutral },
    { name: "Tin giả", value: fake, color: C.bad },
  ]

  const userData = [
    { name: "Hoạt động", value: stats?.activeUsers ?? 0, color: C.good },
    { name: "Đã khóa", value: stats?.lockedUsers ?? 0, color: C.bad },
  ]

  const activity = [
    { name: "Tin nhắn", value: stats?.totalMessages ?? 0 },
    { name: "Lượt theo dõi", value: stats?.totalFollows ?? 0 },
    { name: "Kết bạn", value: stats?.acceptedFriendships ?? 0 },
    { name: "Story đang chạy", value: stats?.activeStories ?? 0 },
  ]

  return (
    <div>
      <PageHeader
        title="Bảng điều khiển quản trị"
        description="Tổng quan sức khỏe nền tảng và mô-đun phát hiện tin giả TGNN."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {flow.map((item, index) => (
          <div key={item.to} className="flex items-center">
            <Link
              to={item.to}
              className="flex min-w-[150px] flex-col gap-1 rounded-xl border border-border bg-panel px-4 py-3 transition-all hover:border-accent-blue hover:-translate-y-0.5"
            >
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
            </Link>
            {index < flow.length - 1 && <ArrowRight className="mx-1 h-4 w-4 text-muted" />}
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Người dùng"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          sub={
            <span className="flex flex-wrap gap-2">
              <StatusPill on labelOn={`${stats?.activeUsers ?? 0} hoạt động`} labelOff="" />
              <StatusPill on={false} labelOn="" labelOff={`${stats?.lockedUsers ?? 0} khóa`} />
            </span>
          }
        />
        <StatTile
          label="Bài viết"
          value={(stats?.totalPosts ?? 0).toLocaleString()}
          sub={`${stats?.visiblePosts ?? 0} hiển thị · ${stats?.hiddenPosts ?? 0} ẩn`}
        />
        <StatTile
          accent
          label="Điểm tin cậy TB"
          value={<>{trust.toFixed(1)}<span className="text-lg text-muted">%</span></>}
          sub="averageTrustScore"
        />
        <StatTile
          label="Tỷ lệ tin giả"
          value={<>{(ai?.fakeDetectionRate ?? 0).toFixed(1)}<span className="text-lg text-muted">%</span></>}
          sub={`${fake} / ${totalPosts} bài`}
        />
      </div>

      {/* Hàng biểu đồ: gauge tin cậy · cơ cấu nội dung · trạng thái người dùng */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AdminCard className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Độ tin cậy trung bình</h3>
            <StatusPill on labelOn="AI đang chạy" labelOff="" />
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={190}>
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[{ name: "trust", value: trust }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background={{ fill: C.track }}
                  dataKey="value"
                  angleAxisId={0}
                  cornerRadius={10}
                  fill={trustColor}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-3xl font-bold tabular-nums" style={{ color: trustColor }}>
                {trust.toFixed(1)}%
              </div>
              <div className="text-xs text-muted">tin cậy</div>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Cơ cấu nội dung</h3>
          <Donut data={contentData} center={totalPosts.toLocaleString()} centerLabel="bài viết" />
          <Legend data={contentData} />
        </AdminCard>

        <AdminCard className="p-5">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Trạng thái người dùng</h3>
          <Donut data={userData} center={(stats?.totalUsers ?? 0).toLocaleString()} centerLabel="tài khoản" />
          <Legend data={userData} />
        </AdminCard>
      </div>

      {/* Hoạt động nền tảng: biểu đồ cột ngang */}
      <AdminCard className="p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Hoạt động nền tảng</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activity} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            />
            <Tooltip cursor={{ fill: "var(--color-border)", opacity: 0.3 }} content={<ChartTooltip />} />
            <Bar dataKey="value" fill={C.accent} radius={[0, 4, 4, 0]} barSize={18}>
              <LabelList
                dataKey="value"
                position="right"
                style={{ fill: "var(--color-foreground)", fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </AdminCard>
    </div>
  )
}
