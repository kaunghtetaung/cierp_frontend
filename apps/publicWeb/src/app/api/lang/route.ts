import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { languageService, LanguageChangeRequest } from "@repo/language";
import { getRootDomainForCookie } from "@repo/utils/server/domain";
import { withApiErrorHandler } from "@repo/utils/server";

/**
 * Language API Routes using the Language Service
 */

/**
 * Change Language - POST /api/lang
 */
export async function POST(request: NextRequest) {
  return withApiErrorHandler(request, async (req) => {
    const body: LanguageChangeRequest = await req.json();
    const { language } = body;

    // Get service configuration for validation
    const config = languageService.getConfig();

    // Validate language code directly without HTTP call
    if (!languageService.isValidLanguage(language)) {
      return NextResponse.json(
        {
          success: false,
          language: language,
          error: `Invalid language code: ${language}. Supported languages: ${languageService
            .getSupportedLanguages()
            .map((l) => l.code)
            .join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Create successful response
    const result = {
      success: true,
      language: language,
      message: `Language changed to ${language}`,
    };

    const response = NextResponse.json(result);

    // Get root domain for cookie sharing across subdomains
    const rootDomain = await getRootDomainForCookie();

    // Set language cookie using service configuration with root domain
    response.cookies.set(config.cookieName!, language, {
      maxAge: config.cookieOptions!.maxAge,
      httpOnly: config.cookieOptions!.httpOnly,
      secure: config.cookieOptions!.secure,
      sameSite: config.cookieOptions!.sameSite as "strict" | "lax" | "none",
      path: config.cookieOptions!.path,
      domain: rootDomain, // Set at root domain level for sharing across subdomains
    });

    return response;
  }, {
    operation: 'change-language',
    component: 'lang-api',
    metadata: { endpoint: '/api/lang' }
  });
}

/**
 * Get Current Language - GET /api/language
 */
export async function GET(request: NextRequest) {
  return withApiErrorHandler(request, async () => {
    const cookieStore = await cookies();
    const config = languageService.getConfig();
    const currentLanguage =
      cookieStore.get(config.cookieName!)?.value || config.defaultLanguage!;

    // Validate the current language
    if (!languageService.isValidLanguage(currentLanguage)) {
      // If invalid, return default language
      const defaultLang = config.defaultLanguage!;
      return NextResponse.json({
        success: true,
        language: defaultLang,
        supportedLanguages: languageService
          .getSupportedLanguages()
          .map((l) => l.code),
        message: `Invalid language detected, defaulting to ${defaultLang}`,
      });
    }

    return NextResponse.json({
      success: true,
      language: currentLanguage,
      supportedLanguages: languageService
        .getSupportedLanguages()
        .map((l) => l.code),
    });
  }, {
    operation: 'get-language',
    component: 'lang-api',
    metadata: { endpoint: '/api/lang' }
  });
}
