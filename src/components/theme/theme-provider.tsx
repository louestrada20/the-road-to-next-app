import {ThemeProvider as BaseThemeProvider} from 'next-themes';

type ThemeProviderProps = {
    children: React.ReactNode;
}

const ThemeProvider = ({children}: ThemeProviderProps) => {
    return (
        <BaseThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            themes={['light', 'dark', 'professional', 'ocean-blue', 'sunset-orange', 'system']}
        >
            {children}
        </BaseThemeProvider>
    )
}

export {ThemeProvider};