"use client";

import { useTenant, TenantLogo } from "@repo/tenant";
import { getLocalizedText } from "@repo/utils";
import { useEffect, useState } from "react";

export default function TenantHomePage({
  params,
}: {
  params: Promise<{ dept: string }>;
}) {
  const { tenant, isLoading, error } = useTenant();
  const [deptParam, setDeptParam] = useState<string>("");
  const [requestInfo, setRequestInfo] = useState({
    hostname: "unknown",
    protocol: "unknown",
    requestId: "unknown",
    language: "unknown",
  });

  // Resolve params Promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setDeptParam(resolvedParams.dept);
    });
  }, [params]);

  // Get request info from headers on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequestInfo({
        hostname: window.location.hostname,
        protocol: window.location.protocol.replace(":", ""),
        requestId:
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("x-request-id="))
            ?.split("=")[1] || "unknown",
        language:
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("x-lang="))
            ?.split("=")[1] || "en",
      });
    }
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading tenant information...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Tenant Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <TenantLogo size="lg" className="mr-4" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {getLocalizedText(tenant?.displayName, requestInfo.language) ||
                  "Welcome"}
              </h1>
              {getLocalizedText(
                tenant?.displayShortName,
                requestInfo.language
              ) && (
                <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                  {getLocalizedText(
                    tenant?.displayShortName,
                    requestInfo.language
                  )}
                </p>
              )}
            </div>
          </div>

          {getLocalizedText(
            tenant?.localizedDescription,
            requestInfo.language
          ) && (
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {getLocalizedText(
                tenant?.localizedDescription,
                requestInfo.language
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Tenant Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg
                className="h-6 w-6 text-blue-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Tenant Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tenant ID
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                    {tenant?.id || "Not available"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                    {deptParam}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language Support
                </label>
                <div className="flex flex-wrap gap-1">
                  {tenant?.langSupport?.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                    >
                      {lang.toUpperCase()}
                    </span>
                  )) || (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      EN
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Root Domain
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {tenant?.rootDomain || requestInfo.hostname}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name ({requestInfo.language?.toUpperCase()})
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {getLocalizedText(
                    tenant?.displayName,
                    requestInfo.language
                  ) || "Not available"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Short Name ({requestInfo.language?.toUpperCase()})
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {getLocalizedText(
                    tenant?.displayShortName,
                    requestInfo.language
                  ) || "Not available"}
                </div>
              </div>
            </div>
          </div>

          {/* Request Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg
                className="h-6 w-6 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Request Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hostname
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {requestInfo.hostname}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Protocol
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {requestInfo.protocol}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Request ID
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {requestInfo.requestId.slice(0, 16)}...
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono text-sm">
                  {requestInfo.language}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {tenant?.contact && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mt-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <svg
                className="h-6 w-6 text-purple-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenant.contact.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm">
                    {tenant.contact.email}
                  </div>
                </div>
              )}

              {tenant.contact.phoneNo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm">
                    {tenant.contact.phoneNo}
                  </div>
                </div>
              )}

              {tenant.contact.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm">
                    {tenant.contact.address}
                  </div>
                </div>
              )}

              {tenant.contact.webSiteUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm">
                    <a
                      href={tenant.contact.webSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {tenant.contact.webSiteUrl}
                    </a>
                  </div>
                </div>
              )}

              {tenant.contact.faceBookUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facebook
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-sm">
                    <a
                      href={tenant.contact.faceBookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {tenant.contact.faceBookUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-500 dark:text-gray-400">
            This page demonstrates the tenant settings loaded from the wrapper
            without secrets.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Middleware resolves tenant → Wrapper caches with secrets → Provider
            gets clean data
          </p>
        </div>
      </div>
    </main>
  );
}
