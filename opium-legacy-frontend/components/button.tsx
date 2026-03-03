import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes}  from "react"
import Link from "next/link";
import { ReactNode } from "react";

const Button = ({
    className,
    children,
    ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    children?: ReactNode;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    onClick?: () => void;
}) => {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center h-10 px-4 border-2 rounded-lg transition-colors duration-200 ease-in-out border-pink-600 bg-pink-700 hover:border-white hover:bg-white hover:text-black disabled:opacity-50 disabled:pointer-events-none",
                className
            )}
            {...rest}
        >
            {children}
        </button>
    );
};

const LinkButton = ({
    className,
    href,
    target,
    children,
}: {
    className?: string;
    children?: ReactNode;
    href: string;
    target?: string,
}) => {
    return (
        <Link
            href={href}
            target={target}
            className={cn(
                "inline-flex items-center justify-center h-10 px-4 transition-colors rounded-lg hover:bg-white/15",
                className
            )}
        >
            {children}
        </Link>
    );
};

export { Button, LinkButton };
