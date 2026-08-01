import { ChevronRight, CircleArrowOutUpRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import { useState } from "react";

type NavItem = {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive: boolean;
  childActive: boolean;
  // Leaf items that open a separate console show a trailing chevron affordance.
  affordance?: boolean;
  items?: {
    title: string;
    url: string;
    isActive: boolean;
    disabled?: boolean;
  }[];
};

export function NavMain({
  items,
  navigationKey,
}: {
  items: NavItem[];
  /** Route key used when several NavMain instances share one sidebar. */
  navigationKey?: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  // Remount the accordion state whenever navigation selects a different leaf
  // or parent. That makes the selected parent the sole open group immediately,
  // while still allowing normal manual open/close interaction between routes.
  const activeNavigationKey = navigationKey ?? (
    items.find((item) => item.childActive)?.title ??
    items.find((item) => item.isActive)?.title ??
    "none"
  );

  return (
    <SidebarGroup>
      <NavMainItems
        key={activeNavigationKey}
        items={items}
        isCollapsed={isCollapsed}
      />
    </SidebarGroup>
  );
}

function NavMainItems({
  items,
  isCollapsed,
}: {
  items: NavItem[];
  isCollapsed: boolean;
}) {
  const [openTitle, setOpenTitle] = useState<string | null>(
    items.find((item) => item.childActive)?.title ?? null,
  );

  return (
    <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const hasChildren = (item?.items?.length ?? 0) > 0;
          // A child route represents the parent section too. Keep both levels
          // highlighted so the current section remains visible at a glance.
          const menuItemActive = item.isActive || item.childActive;

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className="h-9 mx-auto"
                  tooltip={item.title}
                  isActive={item.isActive}
                >
                  <Link to={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.affordance && (
                      <CircleArrowOutUpRight className="ml-auto size-4 text-gray-02" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Collapsed sidebar: show a dropdown popover to the right
          if (isCollapsed) {
            return (
              <SidebarMenuItem key={item.title}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      className="h-9 mx-auto"
                      tooltip={item.title}
                      isActive={menuItemActive}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="min-w-44">
                    <DropdownMenuLabel className="text-xs text-gray-01 font-normal">
                      {item.title}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items?.map((subItem) => (
                      subItem.disabled ? (
                        <DropdownMenuItem key={subItem.title} disabled>
                          {subItem.title}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem key={subItem.title} asChild>
                          <Link
                            to={subItem.url}
                            className={subItem.isActive ? "font-medium text-primary" : ""}
                          >
                            {subItem.title}
                          </Link>
                        </DropdownMenuItem>
                      )
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          }

          // Expanded sidebar: inline collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              open={openTitle === item.title}
              onOpenChange={(open) => setOpenTitle(open ? item.title : null)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="mx-auto h-9"
                    tooltip={item.title}
                    isActive={menuItemActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub className="ml-6">
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        {subItem.disabled ? (
                          <SidebarMenuSubButton
                            className="text-xs opacity-40 cursor-not-allowed pointer-events-none"
                            isActive={false}
                          >
                            {subItem.title}
                          </SidebarMenuSubButton>
                        ) : (
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                            className="text-xs"
                          >
                            <Link to={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
  );
}
