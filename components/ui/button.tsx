import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[--color-gold] text-[--color-black] hover:bg-[--color-gold-dark] focus-visible:ring-[--color-gold]",
        outline:
          "border-2 border-[--color-gold] text-[--color-gold] hover:bg-[--color-gold] hover:text-[--color-black]",
        ghost:
          "text-[--color-foreground] hover:bg-[--color-gray-800] hover:text-[--color-gold]",
        danger:
          "bg-[--color-error] text-white hover:bg-red-600 focus-visible:ring-[--color-error]",
        success:
          "bg-[--color-success] text-white hover:bg-green-600 focus-visible:ring-[--color-success]",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
