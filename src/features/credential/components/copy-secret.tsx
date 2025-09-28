import {Copy} from "lucide-react";
import { useState } from "react";
import {Button} from "@/components/ui/button";


type CopySecretProps = {
    secret: string;
}

const CopySecret = ({secret}: CopySecretProps) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(secret);
        setIsCopied(true);

        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
    }

    return (
        <Button onClick={handleCopy} variant="outline" size="icon" className="w-full">      
            <Copy className="w-4 h-4" />
            {isCopied ? "Secret Copied!" : "Copy Secret to Clipboard"}


        </Button>
    )
}   

export default CopySecret;      