import React from "react";
import { notFound } from "next/navigation";

interface PostTypeSlugPageProps {
  params: Promise<{
    type: string;
    slug: string;
  }>;
}

export default async function PostTypeSlugPage({
  params,
}: PostTypeSlugPageProps) {
  const { type, slug } = await params;

  // TODO: Implement post service integration once @repo/post module is resolved
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Post: {slug}</h1>
        <p className="text-gray-600 mb-4">Type: {type}</p>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Under Development</p>
          <p>
            Post content will be displayed here once the post service is
            integrated.
          </p>
        </div>
      </div>
    </div>
  );
}
