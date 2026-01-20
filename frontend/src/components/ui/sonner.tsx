"use client";

import { Toaster as Sonner } from 'sonner';

// Simple Toaster component without theme dependency
// Note: If you need theme support, install next-themes and use the commented version below
const Toaster = () => {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
    />
  );
};

// Alternative version with theme support (requires next-themes):
// import { useTheme } from "next-themes";
// const Toaster = ({ ...props }: ToasterProps) => {
//   const { theme = "system" } = useTheme();
//   return (
//     <Sonner
//       theme={theme as ToasterProps["theme"]}
//       className="toaster group"
//       position="top-right"
//       richColors
//       closeButton
//       {...props}
//     />
//   );
// };

export { Toaster };
