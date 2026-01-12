"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface CaptchaWidgetProps {
  onSubmit: (token?: string) => void;
  isSubmitting: boolean;
}

interface ReCaptchaWindow extends Window {
  grecaptcha?: {
    execute: (siteKey: string) => Promise<string>;
  };
}

export function CaptchaWidget({ onSubmit, isSubmitting }: CaptchaWidgetProps) {
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string>("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState<string>("");
  const [captchaType, setCaptchaType] = useState<
    "recaptcha" | "turnstile" | "none"
  >("none");

  const loadRecaptchaScript = useCallback((siteKey: string) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const loadTurnstileScript = useCallback(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetch("/api/public/captcha-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.data.recaptcha?.isEnabled) {
          setRecaptchaSiteKey(data.data.recaptcha.siteKey);
          setCaptchaType("recaptcha");
          loadRecaptchaScript(data.data.recaptcha.siteKey);
        } else if (data.data.turnstile?.isEnabled) {
          setTurnstileSiteKey(data.data.turnstile.siteKey);
          setCaptchaType("turnstile");
          loadTurnstileScript();
        }
      });
  }, [loadRecaptchaScript, loadTurnstileScript]);

  const handleRecaptchaExecute = async () => {
    const recaptcha = (window as ReCaptchaWindow).grecaptcha;
    if (recaptcha) {
      const token = await recaptcha.execute(recaptchaSiteKey);
      onSubmit(token);
    }
  };

  const _handleTurnstileSubmit = () => {
    onSubmit();
  };

  if (captchaType === "none") {
    return (
      <Button type="button" onClick={() => onSubmit()} disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "送信"}
      </Button>
    );
  }

  if (captchaType === "recaptcha") {
    return (
      <Button
        type="button"
        onClick={handleRecaptchaExecute}
        disabled={isSubmitting}
      >
        {isSubmitting ? "送信中..." : "送信"}
      </Button>
    );
  }

  if (captchaType === "turnstile") {
    return (
      <div className="space-y-4">
        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-callback={(token: string) => onSubmit(token)}
        />
        {isSubmitting && (
          <p className="text-muted-foreground text-sm">送信中...</p>
        )}
      </div>
    );
  }

  return null;
}
