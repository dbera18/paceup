import { ButtonHTMLAttributes } from "react";
import { buttonClass, ButtonSize, ButtonVariant } from "./styles";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

export default function Button({ variant = "primary", size = "md", block, className = "", type = "button", ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, size, `${block ? "w-full" : ""} ${className}`)} {...rest} />;
}
