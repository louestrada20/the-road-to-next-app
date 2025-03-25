/* eslint-disable  @typescript-eslint/no-explicit-any */
"use client"
import {clsx} from "clsx";
import {LucideLoaderCircle} from "lucide-react";
import {cloneElement} from "react";
import {useFormStatus} from "react-dom";
import {Button} from "@/components/ui/button";

type SubmitButtonProps = {
    label?: string;
    icon?: React.ReactElement<any>;
    variant?: | "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

const SubmitButton = ({label, icon, variant, size}: SubmitButtonProps) => {
    const {pending} = useFormStatus();
    return (
        <Button type="submit" disabled={pending} variant={variant} size={size} >

            {pending && <LucideLoaderCircle className={clsx("h-4 w-2 animate-spin", {
                "mr-2": !!label
            })} />}
            {label}
            {(icon && !pending) ? (
                <span className={clsx({
                    "ml-2": !!label
                })}>
                {cloneElement(icon, {className: "h-4 w-4"})}
                </span>
            )
                : null}

        </Button>
    )
}


export {SubmitButton};