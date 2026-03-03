import { cn } from "@/lib/utils";
import { InputHTMLAttributes, ReactNode } from "react";

const Input = ({
    className,
    children,
    ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
    className?: string;
    children?: ReactNode;
}) => {
    return (
        <input
            className={cn("bg-transparent border-zinc-900 border-2 text-white px-4 py-2 rounded-lg w-full duration-200 ease-in-out focus:outline-none focus:ring-0 focus:border-pink-600 read-only:opacity-75 read-only:cursor-not-allowed read-only:bg-zinc-900/50 read-only:focus:border-zinc-900", className)}
            {...rest}
        >
            {children}
        </input>
    );
};

export { Input };