import type { StatusItem } from '@jeremyprat/status-map';

export const SITE_STATUSES = ['ok', 'warning', 'offline'] as const;

export type SiteStatus = (typeof SITE_STATUSES)[number];

export const SITE_TAGS = ['production', 'préproduction', 'maintenance', 'prioritaire'] as const;

export type SiteTag = (typeof SITE_TAGS)[number];

export interface SiteData {
  name: string;
  model: string;
  tags: readonly SiteTag[];
  /** Date ISO du dernier échange avec le site. */
  lastContact: string;
}

/** Le paquet rend `data` facultatif ; la démo garantit qu'il est toujours présent. */
export type Site = StatusItem<SiteStatus, SiteData> & { data: SiteData };
