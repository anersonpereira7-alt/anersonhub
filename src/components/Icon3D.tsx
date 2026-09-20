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
        "icon-3d relative grid size-11 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-primary-foreground shadow-pop",
        gradient,
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-x-1 top-0 h-[42%] rounded-b-[100%] bg-background/35" />
      <span className="pointer-events-none absolute inset-x-2 bottom-0 h-2 rounded-full bg-ink/20 blur-sm" />
      <Icon className={cn("relative size-5 drop-shadow-md", iconClassName)} strokeWidth={2.6} />
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
