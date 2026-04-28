import React from "react";

type TypographyProps = {
  children?: React.ReactNode;
  className?: string;
};

export function H1({ children, className = "" }: TypographyProps) {
  return (
    <h1
      className={`
        text-4xl md:text-5xl
        font-cinzel font-bold
        text-aq-title
        ${className}
      `}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: TypographyProps) {
  return (
    <h2
      className={`
        text-3xl md:text-4xl
        font-cinzel font-bold
        text-aq-title
        ${className}
      `}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className = "" }: TypographyProps) {
  return (
    <h3
      className={`
        text-2xl md:text-3xl
        font-cinzel font-semibold
        text-aq-title
        ${className}
      `}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className = "" }: TypographyProps) {
  return (
    <h4
      className={`
        text-xl
        font-cinzel font-semibold
        text-aq-title
        ${className}
      `}
    >
      {children}
    </h4>
  );
}

export function Body({ children, className = "" }: TypographyProps) {
  return (
    <p className={`text-base text-aq-text font-lora ${className}`}>
      {children}
    </p>
  );
}

export function Subtitle({ children, className = "" }: TypographyProps) {
  return (
    <p className={`text-lg text-aq-text-muted font-lora ${className}`}>
      {children}
    </p>
  );
}

export function Caption({ children, className = "" }: TypographyProps) {
  return (
    <span className={`text-sm text-aq-text-subtle font-lora ${className}`}>
      {children}
    </span>
  );
}
