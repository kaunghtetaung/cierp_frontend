import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Department Test Page",
  description: "Test page for debugging dynamic department forms with React Hook Form",
};

export default function TestDepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}