import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { env } from '../../config/env';
@Injectable()
export class MailService {
  private readonly transport = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } } : {}) });
  async send(to: string, subject: string, text: string) { await this.transport.sendMail({ from: env.EMAIL_FROM, to, subject, text }); }
}
