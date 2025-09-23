import React from 'react';
import { Mail, CheckCircle, Home, LogIn } from 'lucide-react';
import Link from 'next/link';
import { getMiddlewareDataFromHeaders } from "@repo/utils/server/middleware";
import styles from '../styles/signup.module.css';

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const middlewareData = await getMiddlewareDataFromHeaders();
  const language = middlewareData.language || 'en';
  
  // Translations
  const translations = {
    en: {
      title: 'Account Created Successfully!',
      subtitle: 'Verification Email Sent',
      emailSent: "We've sent a verification email to",
      checkInbox: 'Please check your inbox and click the verification link to activate your account.',
      whatNext: 'What happens next?',
      step1: 'Check your email inbox',
      step2: 'Click the verification link in the email',
      step3: 'Your account will be activated',
      step4: 'You can then sign in with your credentials',
      didntReceive: "Didn't receive the email?",
      checkSpam: 'Check your spam or junk folder',
      waitFew: 'Wait a few minutes and refresh your inbox',
      contactSupport: 'Contact support if you still have issues',
      goToLogin: 'Go to Login',
      backToHome: 'Back to Home'
    },
    mm: {
      title: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါပြီ!',
      subtitle: 'အတည်ပြုရန် အီးမေးလ် ပို့ပြီးပါပြီ',
      emailSent: 'အတည်ပြုရန် အီးမေးလ်ကို ပို့ပြီးပါပြီ',
      checkInbox: 'သင့်အီးမေးလ်ကို စစ်ဆေးပြီး အတည်ပြုလင့်ခ်ကို နှိပ်၍ သင့်အကောင့်ကို အသက်သွင်းပါ။',
      whatNext: 'နောက်ဘာလုပ်ရမလဲ?',
      step1: 'သင့်အီးမေးလ် inbox ကို စစ်ဆေးပါ',
      step2: 'အီးမေးလ်ထဲက အတည်ပြုလင့်ခ်ကို နှိပ်ပါ',
      step3: 'သင့်အကောင့်ကို အသက်သွင်းပါမည်',
      step4: 'ထို့နောက် သင့်အချက်အလက်များဖြင့် ဝင်ရောက်နိုင်ပါပြီ',
      didntReceive: 'အီးမေးလ် မရရှိဘူးလား?',
      checkSpam: 'Spam သို့မဟုတ် Junk ဖိုင်ဒါကို စစ်ဆေးပါ',
      waitFew: 'မိနစ်အနည်းငယ်စောင့်ပြီး inbox ကို refresh လုပ်ပါ',
      contactSupport: 'ပြဿနာရှိနေသေးလျှင် ပံ့ပိုးမှုအဖွဲ့ကို ဆက်သွယ်ပါ',
      goToLogin: 'Login စာမျက်နှာသို့',
      backToHome: 'ပင်မစာမျက်နှာသို့'
    }
  };
  
  const t = translations[language as 'en' | 'mm'] || translations.en;
  const email = searchParams.email || '';

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Success Card */}
        <div className={styles.card} style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Success Icon */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)'
            }}>
              <CheckCircle size={60} style={{ color: 'white' }} />
            </div>
          </div>

          {/* Success Title */}
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            textAlign: 'center',
            marginBottom: '0.5rem',
            color: '#111827'
          }}>
            {t.title}
          </h1>

          {/* Subtitle */}
          <h2 style={{
            fontSize: '1.25rem',
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#6b7280'
          }}>
            {t.subtitle}
          </h2>

          {/* Email Section */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <Mail size={32} style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              {t.emailSent}
            </p>
            <p style={{ 
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              {email}
            </p>
            <p style={{ 
              color: '#6b7280',
              marginTop: '1rem',
              lineHeight: '1.5'
            }}>
              {t.checkInbox}
            </p>
          </div>

          {/* What Next Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              {t.whatNext}
            </h3>
            <ol style={{ listStyle: 'none', padding: 0 }}>
              {[t.step1, t.step2, t.step3, t.step4].map((step, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#dbeafe',
                    color: '#3b82f6',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginRight: '0.75rem',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ color: '#4b5563', lineHeight: '1.5' }}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Didn't Receive Section */}
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: '#92400e'
            }}>
              {t.didntReceive}
            </h4>
            <ul style={{ 
              margin: 0,
              paddingLeft: '1.5rem',
              color: '#92400e'
            }}>
              <li>{t.checkSpam}</li>
              <li>{t.waitFew}</li>
              <li>{t.contactSupport}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)'
              }}
            >
              <LogIn size={18} />
              {t.goToLogin}
            </Link>
            
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#4b5563',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <Home size={18} />
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}