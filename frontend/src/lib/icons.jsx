import {
  Home, Sun, Scissors, GraduationCap, HeartPulse, Truck, Heart, Users,
  Sparkles, ShieldCheck, PawPrint, Star, Bath, Dog, Cat, Bone, Stethoscope,
} from "lucide-react";

const MAP = {
  home: Home, sun: Sun, scissors: Scissors, "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse, truck: Truck, heart: Heart, users: Users,
  sparkles: Sparkles, "shield-check": ShieldCheck, paw: PawPrint, star: Star,
  bath: Bath, dog: Dog, cat: Cat, bone: Bone, stethoscope: Stethoscope,
};

export function ServiceIcon({ name, className }) {
  const Cmp = MAP[name] || PawPrint;
  return <Cmp className={className} />;
}

export const ICON_OPTIONS = Object.keys(MAP);
