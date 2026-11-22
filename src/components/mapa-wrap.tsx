"use client";

import dynamic from "next/dynamic";

export const Mapa = dynamic(() => import("@/components/mapa-oblasti"), { ssr: false, loading: () => <div className="h-[60vh] animate-pulse rounded-[2rem] bg-white" /> });
