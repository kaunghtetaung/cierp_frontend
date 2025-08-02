import React from 'react';

interface DeptPostTypeSlugPageProps {
  params: Promise<{
    dept: string;
    type: string;
    slug: string;
  }>;
}

export default async function DeptPostTypeSlugPage({ params }: DeptPostTypeSlugPageProps) {
  const { dept, type, slug } = await params;
  
  return (
    <div>
      <h1>Department: {dept} - Post Type: {type} - Slug: {slug}</h1>
    </div>
  );
}