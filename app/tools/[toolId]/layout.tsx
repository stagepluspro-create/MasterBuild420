import { tools } from "@/lib/tools";

export function generateStaticParams() {
  return tools.map((tool) => ({
    toolId: tool.id,
  }));
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
