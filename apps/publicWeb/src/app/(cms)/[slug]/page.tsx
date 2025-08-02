import React from "react";
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import { ContentPage } from "../../../themes/default/templates/page/ContentPage";
import { ErrorPage } from "../../../feature-components/error";

interface SlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;

  try {
    // Get tenant and middleware data
    const middlewareData = await getMiddlewareDataFromHeaders();
    const tenantId = middlewareData.tenantId;
    const currentLanguage = middlewareData.language as "en" | "mm";

    if (!middlewareData.tenantId) {
      return (
        <ErrorPage
          type="critical"
          title="Configuration Error"
          message="Unable to determine tenant configuration. Please check your setup."
          showRetry={false}
        />
      );
    }

    return (
      <ContentPage
        slug={slug}
        tenantId={tenantId!}
        currentLanguage={currentLanguage}
      />
    );
  } catch (error) {
    console.error("Error in SlugPage:", error);

    return (
      <>
        <h1>ERROR</h1>
        <ErrorPage
          type="page"
          title="Error Loading Page"
          message={`There was an error loading the page "${slug}". Please try refreshing the page or contact support if the problem persists.`}
        />
      </>
    );
  }
}
