import { kredity } from "@/config/kredity";

export function Kredity({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-neutral-400 ${className}`}>
      3D modely:{" "}
      {kredity.map((k, i) => (
        <span key={k.url}>
          {i > 0 && ", "}
          <a href={k.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            {k.nazov} – {k.autor}
          </a>
        </span>
      ))}{" "}
      (Sketchfab,{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        CC BY 4.0
      </a>
      )
    </p>
  );
}
