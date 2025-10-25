"use client"
import {LucideBriefcase, LucideMonitor, LucideMoon, LucideSun} from "lucide-react";
import {useTheme} from "next-themes";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const themes = [
    { value: 'light', label: 'Light', icon: LucideSun },
    { value: 'dark', label: 'Dark', icon: LucideMoon },
    { value: 'professional', label: 'Professional', icon: LucideBriefcase },
    { value: 'system', label: 'System', icon: LucideMonitor }
];

const ThemeSwitcher = () => {
    const {theme, setTheme} = useTheme();

    return (
        <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
                {themes.map(({value, label, icon: Icon}) => (
                    <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export { ThemeSwitcher }