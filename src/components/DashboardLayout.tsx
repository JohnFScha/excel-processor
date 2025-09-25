import React from "react";
import { Outlet, useNavigate } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Users,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Database
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { ThemeToggler } from "./theme-toggler.tsx";

interface SidebarData {
  title: string;
  items: {
    title: string;
    icon: React.ComponentType<any>;
    onClick: () => void;
    variant?: "default" | "outline";
  }[];
}

interface DashboardSidebarProps {
  data: SidebarData[];
  user?: {
    name: string;
    email: string;
  };
}

function DashboardSidebar({ data, user }: DashboardSidebarProps) {
  const { signOut } = useAuthActions();
  const { open } = useSidebar();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className={`flex items-center gap-2 px-3 py-4 ${open ? "justify-start" : "justify-center p-0"}`}>
          <div className={`flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all size-7`}>
            <Database className={"size-4"} />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Procesador de Excel</span>
            <span className="truncate text-xs text-muted-foreground">Dindadel SRL</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.map((section, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item, itemIndex) => (
                  <SidebarMenuItem key={itemIndex}>
                    <SidebarMenuButton
                      onClick={item.onClick}
                      variant={item.variant}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {user && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem>
                    <User className="mr-2 size-4" />
                    Cuenta
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 size-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut()}>
                    <LogOut className="mr-2 size-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

export function DashboardLayout() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const navigate = useNavigate();

  // Handle navigation using React Router
  const handleNavigation = (section: string) => {
    void navigate(`/${section === 'dashboard' ? '' : section}`);
  };

  const sidebarData: SidebarData[] = [
    {
      title: "Main",
      items: [
        // {
        //   title: "Dashboard",
        //   icon: Home,
        //   onClick: () => handleNavigation("dashboard"),
        // },
        {
          title: "Procesador de Excel",
          icon: Users,
          onClick: () => handleNavigation("excel-processor"),
        }
      ],
    },
    {
      title: "Actions",
      items: [

        {
          title: "Configuración",
          icon: Settings,
          onClick: () => handleNavigation("settings"),
        },
      ],
    },
  ];

  const userData = loggedInUser ? {
    name: loggedInUser.name || loggedInUser.email || "User",
    email: loggedInUser.email || "user@example.com",
  } : undefined;

  return (
    <SidebarProvider>
      <DashboardSidebar
        data={sidebarData}
        user={userData}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex justify-between items-center gap-2 w-full">
            <span className="text-base font-medium">Procesador de Excel</span>
            <ThemeToggler />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-10">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider >
  );
}