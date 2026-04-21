'use client';
import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  to?: string;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  to,
  onClick,
  className = '',
  fullWidth = false,
  disabled = false,
  type = 'button',
}) => {
  const baseStyles = "inline-flex items-center justify-center px-8 py-3 text-base font-semibold transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

  const variants = {
    primary: "bg-neo hover:bg-neo-600 text-white shadow-lg hover:shadow-neo/40 focus:ring-neo hover:-translate-y-1",
    secondary: "bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl focus:ring-gray-900 hover:-translate-y-1",
    outline: "border-2 border-neo text-neo hover:bg-neo hover:text-white focus:ring-neo",
    white: "bg-white text-gray-900 hover:bg-gray-50 shadow-lg hover:shadow-xl focus:ring-white hover:-translate-y-1",
  };

  const widthStyles = fullWidth ? "w-full" : "";
  const combinedClassName = `${baseStyles} ${variants[variant]} ${widthStyles} ${className}`;

  if (to) {
    return (
      <Link href={to} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedClassName} disabled={disabled} type={type}>
      {children}
    </button>
  );
};

export default Button;
