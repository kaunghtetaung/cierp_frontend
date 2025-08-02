import React from 'react';

interface DeptSlugPageProps {
  params: Promise<{
    dept: string;
    slug: string;
  }>;
}

export default async function DeptSlugPage({ params }: DeptSlugPageProps) {
  const { dept, slug } = await params;
  
  return (
    <div>
      <h1>Department: {dept} - Slug: {slug}</h1>
    </div>
  );
}