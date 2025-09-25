import { useState, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { Lightbulb, LightbulbOff } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function ThemeToggler() {
  const { theme, setTheme } = useTheme();
  const [isLight, setIsLight] = useState(theme === "light");

  useEffect(() => {
    setTheme(isLight ? "light" : "dark");
  }, [isLight, setTheme]);

  return (
    <div className="flex items-center">
      <span className="sr-only">Toggle theme</span>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button variant={"outline"} size={"icon"} className="rounded-full" onClick={() => setIsLight(!isLight)}>
            {isLight ? <Lightbulb size={20} /> : <LightbulbOff size={20} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          {isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
