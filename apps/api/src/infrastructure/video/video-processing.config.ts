export interface VideoQualityPreset {
  label: string;
  resolution: string; // e.g. '1280x720'
  videoBitrate: string; // e.g. '1500k'
  audioBitrate: string; // e.g. '128k'
}

export const QUALITY_PRESETS: Record<string, VideoQualityPreset> = {
  '720': {
    label: '720p',
    resolution: '1280x720',
    videoBitrate: '1500k',
    audioBitrate: '128k',
  },
  '480': {
    label: '480p',
    resolution: '854x480',
    videoBitrate: '800k',
    audioBitrate: '96k',
  },
  '360': {
    label: '360p',
    resolution: '640x360',
    videoBitrate: '400k',
    audioBitrate: '64k',
  },
};
