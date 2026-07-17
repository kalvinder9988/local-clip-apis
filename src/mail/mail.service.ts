import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type MailLanguage = 'en' | 'es';

export interface CouponEmailPayload {
    to: string;
    recipientName?: string | null;
    couponCode: string;
    couponName: string;
    businessName?: string | null;
    couponImageUrl?: string | null;
    offerType?: 'flat' | 'percentage' | null;
    offerValue?: number | string | null;
    description?: string | null;
    validFrom?: string | Date | null;
    validTo?: string | Date | null;
    language?: MailLanguage | string | null;
}

export interface WelcomeEmailPayload {
    to: string;
    recipientName?: string | null;
    language?: MailLanguage | string | null;
}

export interface MerchantWelcomeEmailPayload {
    to: string;
    recipientName?: string | null;
    password: string;
    businessName?: string | null;
    language?: MailLanguage | string | null;
}

export interface ForgotPasswordEmailPayload {
    to: string;
    recipientName?: string | null;
    temporaryPassword: string;
    language?: MailLanguage | string | null;
    /** Defaults to FRONTEND_URL; set true to use ADMIN_URL */
    useAdminUrl?: boolean;
    loginUrl?: string | null;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

    constructor(private readonly configService: ConfigService) {
        const host = this.configService.get<string>('SMTP_HOST');
        const user = this.configService.get<string>('SMTP_USER');
        const pass = this.configService.get<string>('SMTP_PASS');

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port: Number(this.configService.get<string>('SMTP_PORT') || 587),
                secure: this.configService.get<string>('SMTP_SECURE') === 'true',
                auth: { user, pass },
            });
        } else {
            this.logger.warn(
                'SMTP is not configured (SMTP_HOST / SMTP_USER / SMTP_PASS). Coupon emails will be skipped.',
            );
        }
    }

    isConfigured(): boolean {
        return !!this.transporter;
    }

    async sendCouponCodeEmail(payload: CouponEmailPayload): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`Skipping coupon email to ${payload.to} — SMTP not configured`);
            return false;
        }

        const from =
            this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER') ||
            'noreply@localclip.com';

        const lang: MailLanguage = payload.language === 'es' ? 'es' : 'en';
        const copy =
            lang === 'es'
                ? {
                      title: 'Tu cupón de LocalClip',
                      greetingFallback: 'amigo',
                      intro: (business: string) =>
                          `Aquí están los detalles de tu cupón de <strong>${this.escapeHtml(business)}</strong>.`,
                      introText: (business: string) => `Aquí tienes los detalles de tu cupón de ${business}.`,
                      couponLabel: 'Cupón',
                      offerLabel: 'Oferta',
                      detailsLabel: 'Detalles',
                      codeLabel: 'Código del cupón',
                      validLabel: 'Válido',
                      validFromTo: (fromDate: string, toDate: string) =>
                          `del <strong>${this.escapeHtml(fromDate)}</strong> al <strong>${this.escapeHtml(toDate)}</strong>`,
                      validUntil: (date: string) =>
                          `hasta el <strong>${this.escapeHtml(date)}</strong>`,
                      redeem: 'Muestra este código en el negocio para canjear tu oferta.',
                      thanks: 'Gracias,',
                      team: 'LocalClip',
                      subjectPrefix: 'Tu cupón de LocalClip',
                  }
                : {
                      title: 'Your LocalClip Coupon',
                      greetingFallback: 'there',
                      intro: (business: string) =>
                          `Here are your coupon details from <strong>${this.escapeHtml(business)}</strong>.`,
                      introText: (business: string) => `Here are your coupon details from ${business}.`,
                      couponLabel: 'Coupon',
                      offerLabel: 'Offer',
                      detailsLabel: 'Details',
                      codeLabel: 'Coupon Code',
                      validLabel: 'Valid',
                      validFromTo: (fromDate: string, toDate: string) =>
                          `from <strong>${this.escapeHtml(fromDate)}</strong> to <strong>${this.escapeHtml(toDate)}</strong>`,
                      validUntil: (date: string) =>
                          `until <strong>${this.escapeHtml(date)}</strong>`,
                      redeem: 'Show this code at the merchant to redeem your offer.',
                      thanks: 'Thanks,',
                      team: 'LocalClip',
                      subjectPrefix: 'Your LocalClip coupon',
                  };

        const name = payload.recipientName?.trim() || copy.greetingFallback;
        const business = payload.businessName?.trim() || 'LocalClip';
        const offerLabel = this.formatOffer(payload.offerType, payload.offerValue, lang);
        const description = payload.description?.trim() || '';
        const imageUrl = payload.couponImageUrl?.trim() || '';
        const validFrom = this.formatDate(payload.validFrom, lang);
        const validTo = this.formatDate(payload.validTo, lang);
        const greeting = lang === 'es' ? `Hola ${name},` : `Hi ${name},`;

        const subject = `${copy.subjectPrefix}: ${payload.couponName}${offerLabel ? ` — ${offerLabel}` : ''}`;

        const text = [
            greeting,
            '',
            copy.introText(business),
            '',
            `${copy.couponLabel}: ${payload.couponName}`,
            offerLabel ? `${copy.offerLabel}: ${offerLabel}` : null,
            description ? `${copy.detailsLabel}: ${description}` : null,
            `${copy.codeLabel}: ${payload.couponCode}`,
            validFrom || validTo
                ? `${copy.validLabel}: ${[validFrom, validTo].filter(Boolean).join(lang === 'es' ? ' a ' : ' to ')}`
                : null,
            '',
            copy.redeem,
            '',
            copy.thanks,
            copy.team,
        ]
            .filter(Boolean)
            .join('\n');

        const imageBlock = imageUrl
            ? `
              <div style="margin: 20px 0;">
                <img
                  src="${this.escapeHtml(imageUrl)}"
                  alt="${this.escapeHtml(payload.couponName)}"
                  style="width: 100%; max-width: 560px; height: auto; border-radius: 12px; display: block; border: 1px solid #e5e7eb;"
                />
              </div>
            `
            : '';

        const offerBlock = offerLabel
            ? `
              <div style="display: inline-block; margin: 8px 0 16px; padding: 8px 14px; background: #ea580c; color: #ffffff; font-weight: 700; font-size: 16px; border-radius: 6px;">
                ${this.escapeHtml(offerLabel)}
              </div>
            `
            : '';

        const descriptionBlock = description
            ? `<p style="color:#4b5563; margin: 0 0 16px;">${this.escapeHtml(description)}</p>`
            : '';

        const validityBlock =
            validFrom || validTo
                ? `<p style="color:#4b5563; margin: 0 0 16px;">${copy.validLabel} ${
                      validFrom && validTo
                          ? copy.validFromTo(validFrom, validTo)
                          : copy.validUntil(validTo || validFrom || '')
                  }.</p>`
                : '';

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #15803d; margin-bottom: 8px;">${this.escapeHtml(copy.title)}</h2>
            <p>${this.escapeHtml(greeting)}</p>
            <p>${copy.intro(business)}</p>
            ${imageBlock}
            <h3 style="margin: 0 0 8px; font-size: 22px; color: #111827;">
              ${this.escapeHtml(payload.couponName)}
            </h3>
            ${offerBlock}
            ${descriptionBlock}
            <div style="margin: 20px 0; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #166534; margin-bottom: 6px;">${this.escapeHtml(copy.codeLabel)}</div>
              <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.08em; color: #14532d;">${this.escapeHtml(payload.couponCode)}</div>
            </div>
            ${validityBlock}
            <p style="color:#4b5563;">${this.escapeHtml(copy.redeem)}</p>
            <p style="margin-top: 28px;">${this.escapeHtml(copy.thanks)}<br/>${this.escapeHtml(copy.team)}</p>
          </div>
        `;

        try {
            await this.transporter.sendMail({
                from,
                to: payload.to,
                subject,
                text,
                html,
            });
            this.logger.log(`Coupon email sent to ${payload.to} (${lang})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send coupon email to ${payload.to}`, error as Error);
            return false;
        }
    }

    async sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`Skipping welcome email to ${payload.to} — SMTP not configured`);
            return false;
        }

        const from =
            this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER') ||
            'noreply@localclip.com';

        const lang: MailLanguage = payload.language === 'es' ? 'es' : 'en';
        const name = payload.recipientName?.trim() || (lang === 'es' ? 'amigo' : 'there');

        const siteUrl = this.getFrontendUrl();

        const content =
            lang === 'es'
                ? {
                      subject: '¡Bienvenido a LocalClip!',
                      title: '¡Bienvenido a LocalClip!',
                      greeting: `Hola ${name},`,
                      intro: '¡Gracias por crear tu cuenta en LocalClip!',
                      body: 'Ya puedes descubrir ofertas locales, guardar cupones y apoyar a los negocios de tu comunidad.',
                      cta: 'Inicia sesión en LocalClip para empezar a ahorrar.',
                      ctaButton: 'Iniciar sesión',
                      thanks: '¡Gracias,',
                      team: 'El equipo de LocalClip',
                      footer: 'Estás recibiendo este correo porque creaste una cuenta en LocalClip.',
                  }
                : {
                      subject: 'Welcome to LocalClip!',
                      title: 'Welcome to LocalClip!',
                      greeting: `Hi ${name},`,
                      intro: 'Thanks for creating your LocalClip account!',
                      body: 'You can now discover local deals, save coupons, and support businesses in your community.',
                      cta: 'Sign in to LocalClip to start saving.',
                      ctaButton: 'Sign in to LocalClip',
                      thanks: 'Thanks,',
                      team: 'The LocalClip Team',
                      footer: 'You are receiving this email because you created a LocalClip account.',
                  };

        const text = [
            content.greeting,
            '',
            content.intro,
            '',
            content.body,
            '',
            content.cta,
            siteUrl,
            '',
            content.thanks,
            content.team,
        ].join('\n');

        const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(content.subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#15803d; padding:28px 32px; text-align:center;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.02em;">
                LocalClip
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
              <h1 style="margin:0 0 20px; font-size:26px; line-height:1.3; color:#15803d; font-weight:700;">
                ${this.escapeHtml(content.title)}
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#111827;">
                ${this.escapeHtml(content.greeting)}
              </p>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#111827; font-weight:700;">
                ${this.escapeHtml(content.intro)}
              </p>
              <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${this.escapeHtml(content.body)}
              </p>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${this.escapeHtml(content.cta)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#15803d; border-radius:8px;">
                    <a href="${this.escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">
                      ${this.escapeHtml(content.ctaButton)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px; font-size:15px; line-height:1.5; color:#111827;">
                ${this.escapeHtml(content.thanks)}
              </p>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#111827; font-weight:600;">
                ${this.escapeHtml(content.team)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px; font-family:Arial, Helvetica, sans-serif; border-top:1px solid #f3f4f6;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#9ca3af;">
                ${this.escapeHtml(content.footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        try {
            await this.transporter.sendMail({
                from,
                to: payload.to,
                subject: content.subject,
                text,
                html,
            });
            this.logger.log(`Welcome email sent to ${payload.to} (${lang})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${payload.to}`, error as Error);
            return false;
        }
    }

    async sendMerchantWelcomeEmail(payload: MerchantWelcomeEmailPayload): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`Skipping merchant welcome email to ${payload.to} — SMTP not configured`);
            return false;
        }

        const from =
            this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER') ||
            'noreply@localclip.com';

        const lang: MailLanguage = payload.language === 'es' ? 'es' : 'en';
        const name = payload.recipientName?.trim() || (lang === 'es' ? 'amigo' : 'there');
        const business = payload.businessName?.trim() || 'LocalClip';
        const adminUrl = this.getAdminUrl();
        const frontendUrl = this.getFrontendUrl();
        const password = payload.password;

        const content =
            lang === 'es'
                ? {
                      subject: '¡Bienvenido a LocalClip Merchant!',
                      title: '¡Bienvenido a LocalClip!',
                      greeting: `Hola ${name},`,
                      intro: `Tu cuenta de comercio para <strong>${this.escapeHtml(business)}</strong> está lista.`,
                      introText: `Tu cuenta de comercio para ${business} está lista.`,
                      body: 'Usa estos datos para iniciar sesión en el panel de administración. También puedes visitar el sitio público de LocalClip.',
                      emailLabel: 'Correo',
                      passwordLabel: 'Contraseña',
                      adminLabel: 'URL del Admin',
                      frontendLabel: 'URL del sitio',
                      ctaButton: 'Ir al Admin',
                      thanks: '¡Gracias,',
                      team: 'El equipo de LocalClip',
                      footer: 'Te recomendamos cambiar tu contraseña después de iniciar sesión.',
                  }
                : {
                      subject: 'Welcome to LocalClip Merchant!',
                      title: 'Welcome to LocalClip!',
                      greeting: `Hi ${name},`,
                      intro: `Your merchant account for <strong>${this.escapeHtml(business)}</strong> is ready.`,
                      introText: `Your merchant account for ${business} is ready.`,
                      body: 'Use these credentials to sign in to the admin panel. You can also visit the public LocalClip website.',
                      emailLabel: 'Email',
                      passwordLabel: 'Password',
                      adminLabel: 'Admin URL',
                      frontendLabel: 'Frontend URL',
                      ctaButton: 'Open Admin Panel',
                      thanks: 'Thanks,',
                      team: 'The LocalClip Team',
                      footer: 'We recommend changing your password after you sign in.',
                  };

        const text = [
            content.greeting,
            '',
            content.introText,
            '',
            content.body,
            '',
            `${content.emailLabel}: ${payload.to}`,
            `${content.passwordLabel}: ${password}`,
            `${content.adminLabel}: ${adminUrl}`,
            `${content.frontendLabel}: ${frontendUrl}`,
            '',
            content.thanks,
            content.team,
        ].join('\n');

        const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(content.subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#15803d; padding:28px 32px; text-align:center;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.02em;">
                LocalClip
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
              <h1 style="margin:0 0 20px; font-size:26px; line-height:1.3; color:#15803d; font-weight:700;">
                ${this.escapeHtml(content.title)}
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#111827;">
                ${this.escapeHtml(content.greeting)}
              </p>
              <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${content.intro}
              </p>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${this.escapeHtml(content.body)}
              </p>
              <div style="margin: 0 0 20px; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <p style="margin:0 0 10px; font-size:14px; color:#166534;">
                  <strong>${this.escapeHtml(content.emailLabel)}:</strong>
                  ${this.escapeHtml(payload.to)}
                </p>
                <p style="margin:0 0 10px; font-size:14px; color:#166534;">
                  <strong>${this.escapeHtml(content.passwordLabel)}:</strong>
                  <span style="font-size:20px; font-weight:700; letter-spacing:0.08em; color:#14532d;">
                    ${this.escapeHtml(password)}
                  </span>
                </p>
                <p style="margin:0 0 10px; font-size:14px; color:#166534; word-break:break-all;">
                  <strong>${this.escapeHtml(content.adminLabel)}:</strong>
                  <a href="${this.escapeHtml(adminUrl)}" style="color:#15803d;">${this.escapeHtml(adminUrl)}</a>
                </p>
                <p style="margin:0; font-size:14px; color:#166534; word-break:break-all;">
                  <strong>${this.escapeHtml(content.frontendLabel)}:</strong>
                  <a href="${this.escapeHtml(frontendUrl)}" style="color:#15803d;">${this.escapeHtml(frontendUrl)}</a>
                </p>
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#15803d; border-radius:8px;">
                    <a href="${this.escapeHtml(adminUrl)}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">
                      ${this.escapeHtml(content.ctaButton)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px; font-size:15px; line-height:1.5; color:#111827;">
                ${this.escapeHtml(content.thanks)}
              </p>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#111827; font-weight:600;">
                ${this.escapeHtml(content.team)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px; font-family:Arial, Helvetica, sans-serif; border-top:1px solid #f3f4f6;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#9ca3af;">
                ${this.escapeHtml(content.footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        try {
            await this.transporter.sendMail({
                from,
                to: payload.to,
                subject: content.subject,
                text,
                html,
            });
            this.logger.log(`Merchant welcome email sent to ${payload.to} (${lang})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send merchant welcome email to ${payload.to}`, error as Error);
            return false;
        }
    }

    async sendForgotPasswordEmail(payload: ForgotPasswordEmailPayload): Promise<boolean> {
        if (!this.transporter) {
            this.logger.warn(`Skipping forgot-password email to ${payload.to} — SMTP not configured`);
            return false;
        }

        const from =
            this.configService.get<string>('SMTP_FROM') ||
            this.configService.get<string>('SMTP_USER') ||
            'noreply@localclip.com';

        const lang: MailLanguage = payload.language === 'es' ? 'es' : 'en';
        const name = payload.recipientName?.trim() || (lang === 'es' ? 'amigo' : 'there');
        const siteUrl = (
            payload.loginUrl?.trim() ||
            (payload.useAdminUrl ? this.getAdminUrl() : this.getFrontendUrl())
        ).replace(/\/$/, '');
        const password = payload.temporaryPassword;

        const content =
            lang === 'es'
                ? {
                      subject: 'Tu nueva contraseña de LocalClip',
                      title: 'Restablecer contraseña',
                      greeting: `Hola ${name},`,
                      intro: 'Recibimos una solicitud para restablecer tu contraseña.',
                      body: 'Usa esta nueva contraseña numérica para iniciar sesión. Te recomendamos cambiarla después de entrar.',
                      emailLabel: 'Correo',
                      passwordLabel: 'Nueva contraseña',
                      cta: 'Inicia sesión en LocalClip con tu nueva contraseña.',
                      ctaButton: 'Iniciar sesión',
                      thanks: '¡Gracias,',
                      team: 'El equipo de LocalClip',
                      footer: 'Si no solicitaste este cambio, contacta con soporte.',
                  }
                : {
                      subject: 'Your new LocalClip password',
                      title: 'Password reset',
                      greeting: `Hi ${name},`,
                      intro: 'We received a request to reset your password.',
                      body: 'Use this new numeric password to sign in. We recommend changing it after you log in.',
                      emailLabel: 'Email',
                      passwordLabel: 'New Password',
                      cta: 'Sign in to LocalClip with your new password.',
                      ctaButton: 'Sign in to LocalClip',
                      thanks: 'Thanks,',
                      team: 'The LocalClip Team',
                      footer: 'If you did not request this change, please contact support.',
                  };

        const text = [
            content.greeting,
            '',
            content.intro,
            '',
            content.body,
            '',
            `${content.emailLabel}: ${payload.to}`,
            `${content.passwordLabel}: ${password}`,
            '',
            content.cta,
            siteUrl,
            '',
            content.thanks,
            content.team,
        ].join('\n');

        const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.escapeHtml(content.subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#15803d; padding:28px 32px; text-align:center;">
              <div style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:0.02em;">
                LocalClip
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
              <h1 style="margin:0 0 20px; font-size:26px; line-height:1.3; color:#15803d; font-weight:700;">
                ${this.escapeHtml(content.title)}
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#111827;">
                ${this.escapeHtml(content.greeting)}
              </p>
              <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${this.escapeHtml(content.intro)}
              </p>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${this.escapeHtml(content.body)}
              </p>
              <div style="margin: 0 0 24px; padding: 16px 20px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                <p style="margin:0 0 10px; font-size:14px; color:#166534;">
                  <strong>${this.escapeHtml(content.emailLabel)}:</strong>
                  ${this.escapeHtml(payload.to)}
                </p>
                <p style="margin:0; font-size:14px; color:#166534;">
                  <strong>${this.escapeHtml(content.passwordLabel)}:</strong>
                  <span style="font-size:22px; font-weight:700; letter-spacing:0.08em; color:#14532d;">
                    ${this.escapeHtml(password)}
                  </span>
                </p>
              </div>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4b5563;">
                ${this.escapeHtml(content.cta)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#15803d; border-radius:8px;">
                    <a href="${this.escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer"
                       style="display:inline-block; padding:14px 28px; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none;">
                      ${this.escapeHtml(content.ctaButton)}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px; font-size:15px; line-height:1.5; color:#111827;">
                ${this.escapeHtml(content.thanks)}
              </p>
              <p style="margin:0; font-size:15px; line-height:1.5; color:#111827; font-weight:600;">
                ${this.escapeHtml(content.team)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px; font-family:Arial, Helvetica, sans-serif; border-top:1px solid #f3f4f6;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#9ca3af;">
                ${this.escapeHtml(content.footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        try {
            await this.transporter.sendMail({
                from,
                to: payload.to,
                subject: content.subject,
                text,
                html,
            });
            this.logger.log(`Forgot-password email sent to ${payload.to} (${lang})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send forgot-password email to ${payload.to}`, error as Error);
            return false;
        }
    }

    private getFrontendUrl(): string {
        return (this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3003')
            .split(',')[0]
            .trim()
            .replace(/\/$/, '');
    }

    private getAdminUrl(): string {
        return (this.configService.get<string>('ADMIN_URL') || 'http://localhost:3002')
            .split(',')[0]
            .trim()
            .replace(/\/$/, '');
    }

    private formatOffer(
        type?: 'flat' | 'percentage' | null,
        value?: number | string | null,
        lang: MailLanguage = 'en',
    ): string {
        if (value == null || value === '') return '';
        const amount = Number(value);
        if (Number.isNaN(amount)) return '';
        if (lang === 'es') {
            if (type === 'percentage') return `${amount}% DE DESCUENTO`;
            if (type === 'flat') return `$${amount.toFixed(2)} DE DESCUENTO`;
            return `${amount} DE DESCUENTO`;
        }
        if (type === 'percentage') return `${amount}% OFF`;
        if (type === 'flat') return `$${amount.toFixed(2)} OFF`;
        return `${amount} OFF`;
    }

    private formatDate(value?: string | Date | null, lang: MailLanguage = 'en'): string | null {
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
