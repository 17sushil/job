import type { RequestHandler } from 'express';
import { AppError } from '../../common/errors/AppError.js';
import { env } from '../../config/env.js';
import {
  AuthService,
  COOKIE_NAME,
  cookieOptions,
  signSession,
  toSafeUser,
} from './auth.service.js';

const authService = new AuthService();

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: { requiresOtp: true, identifier: user.email ?? user.mobile },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.startLogin(req.body);
    res.json({
      success: true,
      data: { requiresOtp: true, identifier: result.identifier },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.verifyOtp(req.body);
    res
      .cookie(COOKIE_NAME, signSession(user), cookieOptions())
      .json({
        success: true,
        data: { user: toSafeUser(user), token: signSession(user) },
      });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = async (req, res) => {
  res.json({ success: true, data: { user: toSafeUser(req.user!) } });
};

export const uploadResume: RequestHandler = async (req, res, next) => {
  try {
    if (req.user!.role.toLowerCase() !== 'candidate') {
      throw new AppError(403, 'Only candidates can upload a resume');
    }
    const { fileName, dataBase64, parsed } = req.body;

    /* Server-side extraction: send the file to the ATS resume service and
       store whatever it parses. The API key never leaves the backend. */
    let parsedProfile: Record<string, unknown> | null = parsed ?? null;
    let atsError: string | null = null;
    if (!parsedProfile && env.ATS_API_KEY.length > 0) {
      try {
        const buffer = Buffer.from(String(dataBase64), 'base64');
        const form = new FormData();
        form.append('file', new Blob([buffer], { type: 'application/pdf' }), fileName);
        form.append('max_pages', String(env.ATS_MAX_PAGES));
        const atsRes = await fetch(`${env.ATS_ENDPOINT}/v1/format`, {
          method: 'POST',
          headers: { 'X-API-Key': env.ATS_API_KEY },
          body: form,
        });
        if (!atsRes.ok) {
          atsError = `Extraction service replied ${atsRes.status}`;
        } else {
          parsedProfile = (await atsRes.json()) as Record<string, unknown>;
        }
      } catch {
        atsError = 'Extraction service is unreachable right now';
      }
    } else if (!parsedProfile) {
      atsError = 'Extraction service is not configured on the server';
    }

    const user = await authService.uploadResume(
      req.user!.userId,
      fileName,
      dataBase64,
      parsedProfile,
    );
    res.json({
      success: true,
      data: { user: toSafeUser(user), parsed: parsedProfile, atsError },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ success: true, data: { message: 'Password changed' } });
  } catch (error) {
    next(error);
  }
};

export const logoutUser: RequestHandler = async (_req, res) => {
  res
    .clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined })
    .json({ success: true, data: { message: 'Logged out' } });
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: { user: toSafeUser(user) } });
  } catch (error) {
    next(error);
  }
};
