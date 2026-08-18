// Logos de marque servis par le site lui-même (aucun CDN externe).
import applepay from "./applepay.svg";
import github from "./github.svg";
import gmail from "./gmail.svg";
import googlecalendar from "./googlecalendar.svg";
import googledrive from "./googledrive.svg";
import googlepay from "./googlepay.svg";
import mastercard from "./mastercard.svg";
import react from "./react.svg";
import revolut from "./revolut.svg";
import supabase from "./supabase.svg";
import tailwindcss from "./tailwindcss.svg";
import tanstack from "./tanstack.svg";
import themoviedatabase from "./themoviedatabase.svg";
import typescript from "./typescript.svg";
import vercel from "./vercel.svg";
import visa from "./visa.svg";
import vite from "./vite.svg";

export const brandLogos = {
  applepay, github, gmail, googlecalendar, googledrive, googlepay, mastercard,
  react, revolut, supabase, tailwindcss, tanstack, themoviedatabase, typescript,
  vercel, visa, vite,
} as const;

export type BrandLogoKey = keyof typeof brandLogos;
