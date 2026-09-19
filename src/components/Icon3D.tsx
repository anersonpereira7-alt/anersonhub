import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Send,
  MessageCircle,
  Music,
  Globe,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { getIcon } from "@/lib/icon-library";
import { cn } from "@/lib/utils";

/** Ícone 3D com gradiente usado nas categorias. */
export function Icon3D({
  iconId,
  className,
  iconClassName,
}: {
  iconId: string;
  className?: string;
  iconClassName?: string;
}) {
  const { Icon, gradient } = getIcon(iconId);
  return (
    <span
      className={cn(
        "relative grid size-11 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-pop",
        gradient,
        className,
      )}
      style={{ boxShadow: "0 8px 18px -6px rgba(30,27,75,0.45)" }}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-b-[100%] bg-white/30" />
      <Icon className={cn("relative size-5", iconClassName)} strokeWidth={2.4} />
    </span>
  );
}

export const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  send: Send,
  "message-circle": MessageCircle,
  music: Music,
  globe: Globe,
  mail: Mail,
};

export function SocialIcon({ iconId, className }: { iconId: string; className?: string }) {
  const Icon = SOCIAL_ICONS[iconId] ?? Globe;
  return <Icon className={cn("size-5", className)} />;
}
