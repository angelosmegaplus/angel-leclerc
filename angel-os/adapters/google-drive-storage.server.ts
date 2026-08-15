// SPDX-License-Identifier: GPL-2.0-only
import type { AngelOSAdapter } from '../core/types';
import type { AngelStorageClient } from './storage.server';

type DriveFile = {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
  mimeType?: string;
  appProperties?: Record<string, string>;
};

type TokenState = {
  value: string;
  expiresAt: number;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function q(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function fileName(path: string): string {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  return normalized.split('/').pop() || 'file';
}

function toBlob(body: ArrayBuffer | Uint8Array | Blob): Blob {
  if (body instanceof Blob) return body;
  if (body instanceof Uint8Array) return new Blob([body]);
  return new Blob([body]);
}

export const googleDriveStorageAdapter: AngelOSAdapter<AngelStorageClient> = {
  id: 'angel.storage.google-drive',
  capability: 'storage',
  connect() {
    const clientId = required('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = required('GOOGLE_DRIVE_CLIENT_SECRET');
    const refreshToken = required('GOOGLE_DRIVE_REFRESH_TOKEN');
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    let token: TokenState | null = null;

    async function accessToken(): Promise<string> {
      if (token && Date.now() < token.expiresAt - 60_000) return token.value;

      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!response.ok) throw new Error(`Google Drive token refresh failed: ${response.status}`);

      const payload = (await response.json()) as { access_token: string; expires_in?: number };
      token = {
        value: payload.access_token,
        expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
      };
      return token.value;
    }

    async function driveFetch(url: string, init: RequestInit = {}): Promise<Response> {
      const bearer = await accessToken();
      const headers = new Headers(init.headers);
      headers.set('authorization', `Bearer ${bearer}`);
      const response = await fetch(url, { ...init, headers });
      if (response.status === 401) token = null;
      return response;
    }

    async function findByPath(path: string): Promise<DriveFile | null> {
      const query = [
        'trashed = false',
        `appProperties has { key='angelManaged' and value='true' }`,
        `appProperties has { key='angelPath' and value='${q(path)}' }`,
      ].join(' and ');
      const params = new URLSearchParams({
        q: query,
        fields: 'files(id,name,size,modifiedTime,mimeType,appProperties)',
        pageSize: '2',
      });
      const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      if (!response.ok) throw new Error(`Google Drive lookup failed: ${response.status}`);
      const payload = (await response.json()) as { files?: DriveFile[] };
      return payload.files?.[0] ?? null;
    }

    async function upload(path: string, body: ArrayBuffer | Uint8Array | Blob) {
      const existing = await findByPath(path);
      const blob = toBlob(body);
      const metadata: Record<string, unknown> = {
        name: fileName(path),
        appProperties: {
          angelManaged: 'true',
          angelPath: path,
        },
      };
      if (!existing && rootFolderId) metadata.parents = [rootFolderId];

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob, fileName(path));

      const base = 'https://www.googleapis.com/upload/drive/v3/files';
      const url = existing
        ? `${base}/${encodeURIComponent(existing.id)}?uploadType=multipart&fields=id,size,modifiedTime`
        : `${base}?uploadType=multipart&fields=id,size,modifiedTime`;
      const response = await driveFetch(url, {
        method: existing ? 'PATCH' : 'POST',
        body: form,
      });
      if (!response.ok) throw new Error(`Google Drive upload failed: ${response.status}`);
      const payload = (await response.json()) as DriveFile;
      return {
        size: Number(payload.size ?? blob.size),
        updatedAt: payload.modifiedTime ?? new Date().toISOString(),
      };
    }

    async function listManaged(prefix = ''): Promise<DriveFile[]> {
      const files: DriveFile[] = [];
      let pageToken: string | undefined;
      do {
        const query = [
          'trashed = false',
          `appProperties has { key='angelManaged' and value='true' }`,
        ].join(' and ');
        const params = new URLSearchParams({
          q: query,
          fields: 'nextPageToken,files(id,name,size,modifiedTime,mimeType,appProperties)',
          pageSize: '1000',
        });
        if (pageToken) params.set('pageToken', pageToken);
        const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params}`);
        if (!response.ok) throw new Error(`Google Drive list failed: ${response.status}`);
        const payload = (await response.json()) as { files?: DriveFile[]; nextPageToken?: string };
        files.push(...(payload.files ?? []));
        pageToken = payload.nextPageToken;
      } while (pageToken);

      return files.filter((file) => (file.appProperties?.angelPath ?? '').startsWith(prefix));
    }

    return {
      put: upload,
      async get(path) {
        const file = await findByPath(path);
        if (!file) return null;
        const response = await driveFetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
        );
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`Google Drive download failed: ${response.status}`);
        return response.arrayBuffer();
      },
      async delete(path) {
        const file = await findByPath(path);
        if (!file) return;
        const response = await driveFetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}`,
          { method: 'DELETE' },
        );
        if (!response.ok && response.status !== 404) {
          throw new Error(`Google Drive delete failed: ${response.status}`);
        }
      },
      async list(prefix = '') {
        const files = await listManaged(prefix);
        return files.map((file) => ({
          name: file.appProperties?.angelPath ?? file.name,
          directory: false,
          size: Number(file.size ?? 0),
          updatedAt: file.modifiedTime ?? new Date(0).toISOString(),
        }));
      },
      async health() {
        try {
          const response = await driveFetch('https://www.googleapis.com/drive/v3/about?fields=user(permissionId)');
          return response.ok;
        } catch {
          return false;
        }
      },
    };
  },
};
