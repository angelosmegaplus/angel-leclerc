import { SystemBootExperience } from "@/components/angel-os/SystemBootExperience";

export function BootIntro({ done }: { done: () => void }) {
  return <SystemBootExperience done={done} label="Démarrage d'Angel OS" />;
}
