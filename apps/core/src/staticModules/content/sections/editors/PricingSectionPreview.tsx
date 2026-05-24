'use client';

import React from 'react';
import { Check, X as XIcon, Sparkles } from 'lucide-react';
import { cn } from '@repo/ui';
import type { PricingSectionFormData } from './pricing-types';

interface PricingSectionPreviewProps {
  data: PricingSectionFormData;
  language?: 'en' | 'mm';
}

function getSpacingValue(value: string): string {
  const map: Record<string, string> = {
    none: '0',
    sm: '1rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  };
  return map[value] || value;
}

function buttonClass(style: string): string {
  switch (style) {
    case 'primary':
      return 'bg-primary text-primary-foreground hover:bg-primary/90';
    case 'secondary':
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    case 'outline':
      return 'border border-current bg-transparent hover:bg-foreground/10';
    default:
      return 'bg-primary text-primary-foreground';
  }
}

function formatPeriodLabel(period: string): string {
  switch (period) {
    case 'month':
      return '/mo';
    case 'year':
      return '/yr';
    case 'one-time':
      return '';
    default:
      return '';
  }
}

function formatAmount(amount: number, currency: string): string {
  if (amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function PricingSectionPreview({
  data,
  language = 'en',
}: PricingSectionPreviewProps) {
  const headline = data.headline?.[language] || data.headline?.en || '';
  const description =
    data.description?.[language] || data.description?.en || '';

  const spacingStyles: React.CSSProperties = {
    paddingTop: data.spacing?.paddingTop
      ? getSpacingValue(data.spacing.paddingTop)
      : undefined,
    paddingBottom: data.spacing?.paddingBottom
      ? getSpacingValue(data.spacing.paddingBottom)
      : undefined,
    paddingLeft: data.spacing?.paddingLeft
      ? getSpacingValue(data.spacing.paddingLeft)
      : undefined,
    paddingRight: data.spacing?.paddingRight
      ? getSpacingValue(data.spacing.paddingRight)
      : undefined,
    marginTop: data.spacing?.marginTop
      ? getSpacingValue(data.spacing.marginTop)
      : undefined,
    marginBottom: data.spacing?.marginBottom
      ? getSpacingValue(data.spacing.marginBottom)
      : undefined,
  };

  const containerClasses = cn(
    'bg-background rounded shadow-lg p-6 md:p-10',
    data.containerSettings?.width === 'fullWidth' ? 'w-full' : '',
    data.containerSettings?.width === 'contained' ? 'max-w-6xl mx-auto' : '',
  );

  const responsiveClasses = cn(
    data.responsiveSettings?.hideOnMobile ? 'hidden md:block' : '',
    data.responsiveSettings?.hideOnTablet ? 'md:hidden lg:block' : '',
    data.responsiveSettings?.hideOnDesktop ? 'lg:hidden' : '',
  );

  const plans = data.plans || [];
  const plansCount = plans.length;
  const cardsGridCols =
    plansCount >= 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : plansCount === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : plansCount === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : 'grid-cols-1';

  const layout = data.layout || 'cards';

  return (
    <div
      className={cn(containerClasses, responsiveClasses)}
      style={{
        ...spacingStyles,
        maxWidth:
          data.containerSettings?.width === 'custom'
            ? data.containerSettings.maxWidth
            : undefined,
      }}
    >
      {(headline || description) && (
        <div className="text-center mb-8 md:mb-10">
          {headline && (
            <h2
              className="text-2xl md:text-4xl font-bold leading-tight"
              style={{
                color: data.textColors?.headline || undefined,
                fontSize: data.headlineSize
                  ? `${data.headlineSize}px`
                  : undefined,
              }}
            >
              {headline}
            </h2>
          )}
          {description && (
            <p
              className="mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto"
              style={{
                color: data.textColors?.description || undefined,
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-sm italic text-muted-foreground text-center py-8">
          Add at least one plan in the editor.
        </div>
      ) : layout === 'table' ? (
        <PricingTable plans={plans} language={language} textColors={data.textColors} />
      ) : (
        <div className={cn('grid gap-6', cardsGridCols)}>
          {plans.map((plan, idx) => {
            const planName = plan.name?.[language] || plan.name?.en || `Plan ${idx + 1}`;
            const planDesc =
              plan.description?.[language] || plan.description?.en || '';
            const badgeText =
              plan.badge?.[language] || plan.badge?.en || 'Popular';
            const buttonText =
              plan.button?.text?.[language] ||
              plan.button?.text?.en ||
              'Get Started';

            return (
              <div
                key={idx}
                className={cn(
                  'relative flex flex-col rounded-lg border bg-background p-6 transition-shadow',
                  plan.popular
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'shadow-sm hover:shadow-md',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                      <Sparkles className="h-3 w-3" />
                      {badgeText}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: data.textColors?.plan || undefined }}
                  >
                    {planName}
                  </h3>
                  {planDesc && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {planDesc}
                    </p>
                  )}
                </div>

                <div className="mb-5">
                  <div
                    className="flex items-baseline gap-1"
                    style={{ color: data.textColors?.price || undefined }}
                  >
                    <span className="text-3xl md:text-4xl font-bold tracking-tight">
                      {formatAmount(plan.price.amount, plan.price.currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatPeriodLabel(plan.price.period)}
                    </span>
                  </div>
                </div>

                {plan.features && plan.features.length > 0 && (
                  <ul className="flex-1 space-y-2 mb-6">
                    {plan.features.map((f, i) => {
                      const ftext =
                        f.text?.[language] || f.text?.en || '';
                      return (
                        <li
                          key={i}
                          className={cn(
                            'flex items-start gap-2 text-sm',
                            !f.included && 'text-muted-foreground',
                            f.highlight && 'font-medium',
                          )}
                        >
                          {f.included ? (
                            <Check className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                          ) : (
                            <XIcon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/60" />
                          )}
                          <span className={cn(!f.included && 'line-through')}>
                            {ftext}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <a
                  href={plan.button?.url || '#'}
                  className={cn(
                    'mt-auto inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                    buttonClass(plan.button?.style || 'primary'),
                  )}
                >
                  {buttonText}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PricingTable({
  plans,
  language,
  textColors,
}: {
  plans: PricingSectionFormData['plans'];
  language: 'en' | 'mm';
  textColors?: PricingSectionFormData['textColors'];
}) {
  // Build a unified feature index across all plans so each row reads the
  // same feature consistently. Keyed by EN text since MM may be missing.
  const featureKeys: string[] = [];
  const featureLabels: Record<string, { en: string; mm?: string }> = {};
  plans.forEach((p) => {
    p.features?.forEach((f) => {
      const key = f.text?.en || '';
      if (!key) return;
      if (!(key in featureLabels)) {
        featureKeys.push(key);
        featureLabels[key] = { en: key, mm: f.text?.mm };
      }
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-semibold">Feature</th>
            {plans.map((plan, idx) => {
              const planName =
                plan.name?.[language] || plan.name?.en || `Plan ${idx + 1}`;
              return (
                <th
                  key={idx}
                  className={cn(
                    'p-3 text-center font-semibold',
                    plan.popular && 'bg-primary/5',
                  )}
                  style={{ color: textColors?.plan || undefined }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{planName}</span>
                    {plan.popular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        <Sparkles className="h-2.5 w-2.5" />
                        {plan.badge?.[language] ||
                          plan.badge?.en ||
                          'Popular'}
                      </span>
                    )}
                    <span
                      className="text-xs font-normal text-muted-foreground"
                      style={{ color: textColors?.price || undefined }}
                    >
                      {formatAmount(plan.price.amount, plan.price.currency)}
                      {formatPeriodLabel(plan.price.period)}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {featureKeys.length === 0 ? (
            <tr>
              <td
                colSpan={plans.length + 1}
                className="p-6 text-center text-muted-foreground italic"
              >
                Add features to plans to see them in this comparison.
              </td>
            </tr>
          ) : (
            featureKeys.map((key) => {
              const label = featureLabels[key];
              const text =
                (language === 'mm' && label?.mm) || label?.en || key;
              return (
                <tr key={key} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{text}</td>
                  {plans.map((plan, idx) => {
                    const f = plan.features?.find((x) => x.text?.en === key);
                    return (
                      <td
                        key={idx}
                        className={cn(
                          'p-3 text-center',
                          plan.popular && 'bg-primary/5',
                        )}
                      >
                        {f?.included ? (
                          <Check className="h-4 w-4 mx-auto text-green-600" />
                        ) : (
                          <XIcon className="h-4 w-4 mx-auto text-muted-foreground/40" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
          <tr>
            <td className="p-3" />
            {plans.map((plan, idx) => {
              const buttonText =
                plan.button?.text?.[language] ||
                plan.button?.text?.en ||
                'Get Started';
              return (
                <td
                  key={idx}
                  className={cn('p-3', plan.popular && 'bg-primary/5')}
                >
                  <a
                    href={plan.button?.url || '#'}
                    className={cn(
                      'inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                      buttonClass(plan.button?.style || 'primary'),
                    )}
                  >
                    {buttonText}
                  </a>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
