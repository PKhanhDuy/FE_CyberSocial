import { useState } from "react"
import { NavLink } from "react-router-dom"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { CreatePostModal } from "@/components/feed/CreatePostModal"
import { mobileNavItems } from "./layoutNav"

const leftMobileNavItems = mobileNavItems.slice(0, 2)
const rightMobileNavItems = mobileNavItems.slice(2)

function MobileNavItem({
  item,
  end,
}: {
  item: (typeof mobileNavItems)[number]
  end?: boolean
}) {
  const { t } = useTranslation()

  return (
    <NavLink
      to={item.path}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-w-0 flex-1 flex-col items-center justify-end gap-0.5 py-2",
          isActive ? "text-accent-blue" : "text-muted",
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-accent-blue")} />
          <span className="w-full truncate text-center text-[10px] font-medium leading-tight">
            {t(item.labelKey)}
          </span>
        </>
      )}
    </NavLink>
  )
}

export function MobileBottomNav() {
  const { t } = useTranslation()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden",
          "pb-[env(safe-area-inset-bottom,0px)]",
        )}
      >
        <div className="mx-auto flex h-[4.25rem] w-full max-w-lg items-end px-1">
          {leftMobileNavItems.map((item) => (
            <MobileNavItem key={item.path} item={item} end={item.path === "/"} />
          ))}

          <div className="flex w-14 shrink-0 flex-col items-center justify-end pb-2.5">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-pink/60 bg-accent-pink/20 text-accent-pink shadow-[var(--shadow-neon-pink)]"
              aria-label={t("nav.createPost")}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {rightMobileNavItems.map((item) => (
            <MobileNavItem key={item.path} item={item} />
          ))}
        </div>
      </nav>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  )
}
