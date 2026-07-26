import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const { className, style, ...rest } = props

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={["toaster group", className].filter(Boolean).join(" ")}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        close: <XIcon className="size-3.5" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    />
  )
}

type SidebarState = "expanded" | "collapsed"

const sharedToasterProps = {
  position: "top-center",
  closeButton: true,
  expand: true,
  visibleToasts: 3,
  gap: 8,
  toastOptions: {
    closeButtonAriaLabel: "Dismiss notification",
  },
} satisfies ToasterProps

export function getWorkspaceToastCenter(sidebarState: SidebarState) {
  return sidebarState === "expanded"
    ? "calc(50% + 8rem)"
    : "calc(50% + 1.5rem)"
}

function WorkspaceToaster({ sidebarState }: { sidebarState: SidebarState }) {
  return (
    <Toaster
      {...sharedToasterProps}
      className="app-toaster workspace-toaster"
      offset={{ top: 68 }}
      mobileOffset={{ top: 68, right: 16, left: 16 }}
      style={
        {
          "--width": "380px",
          "--workspace-toast-center": getWorkspaceToastCenter(sidebarState),
          zIndex: 40,
        } as React.CSSProperties
      }
    />
  )
}

function AuthToaster() {
  return (
    <Toaster
      {...sharedToasterProps}
      className="app-toaster auth-toaster"
      offset={{ top: 16 }}
      mobileOffset={{ top: 16, right: 16, left: 16 }}
      style={{ "--width": "380px" } as React.CSSProperties}
    />
  )
}

export { AuthToaster, Toaster, WorkspaceToaster }
