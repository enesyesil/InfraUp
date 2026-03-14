import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Users,
  MessageCircle,
  Headphones,
  BarChart3,
  Mail,
  ClipboardList,
  ShieldCheck,
  HardDrive,
  Activity,
  LineChart,
  GitBranch,
  Zap,
  FileInput,
  CalendarDays,
  KeyRound,
  Wallet,
  Globe,
  Video,
  UserCog,
  Wrench,
  Package,
  type LucideIcon,
} from "lucide-react";
import { formatCategory, categorySlug } from "@/lib/utils";

interface CategoryCardProps {
  category: string;
  count: number;
}

const categoryIcons: Record<string, LucideIcon> = {
  DOCS: FileText,
  CRM: Users,
  MESSAGING: MessageCircle,
  SUPPORT: Headphones,
  ANALYTICS: BarChart3,
  EMAIL_MARKETING: Mail,
  PROJECT_MANAGEMENT: ClipboardList,
  AUTH: ShieldCheck,
  STORAGE: HardDrive,
  STATUS: Activity,
  MONITORING: LineChart,
  GIT_DEVOPS: GitBranch,
  AUTOMATION: Zap,
  FORMS: FileInput,
  SCHEDULING: CalendarDays,
  PASSWORD_MANAGER: KeyRound,
  FINANCE: Wallet,
  CMS: Globe,
  VIDEO_CONFERENCING: Video,
  HR: UserCog,
  INTERNAL_TOOLS: Wrench,
};

export function CategoryCard({ category, count }: CategoryCardProps) {
  const Icon = categoryIcons[category] || Package;

  return (
    <Link
      href={`/apps/${categorySlug(category)}`}
      className="group block card p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <div
            className="w-10 h-10 border-2 border-ink flex items-center justify-center group-hover:border-accent transition-all duration-150"
            style={{ boxShadow: "var(--shadow-brutal-sm)" }}>
            <Icon size={20} className="text-ink" strokeWidth={1.5} />
          </div>
          <h3 className="mt-3 font-serif text-lg font-bold">
            {formatCategory(category)}
          </h3>
          <p className="mt-1 font-mono text-xs text-ink/50">
            {count} {count === 1 ? "tool" : "tools"}
          </p>
        </div>
        <ArrowRight
          size={18}
          className="text-ink/30 group-hover:text-accent transition-colors"
        />
      </div>
    </Link>
  );
}
