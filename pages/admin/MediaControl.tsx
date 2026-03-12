import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Copy,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ADMIN_IMAGE_GUIDES, formatImageGuideHint, validateImageAgainstGuide } from '../../utils/adminImageGuides';
import { optimizeImageByGuide, optimizeImageForUpload } from '../../utils/imageOptimization';

type BucketName = 'assets' | 'avatars' | 'payment-proofs';
type MediaTypeFilter = 'all' | 'images' | 'others';
type GuideKey = keyof typeof ADMIN_IMAGE_GUIDES | 'none';

interface StorageListItem {
  name: string;
  id?: string | null;
  updated_at?: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
}

interface MediaItem {
  bucket: BucketName;
  path: string;
  name: string;
  updatedAt: string;
  sizeBytes: number;
  mimeType: string;
  isImage: boolean;
  publicUrl: string;
}

const BUCKET_OPTIONS: Array<{ value: BucketName; label: string; isPrivate: boolean }> = [
  { value: 'assets', label: 'Assets (Public)', isPrivate: false },
  { value: 'avatars', label: 'Avatars (Public)', isPrivate: false },
  { value: 'payment-proofs', label: 'Payment Proofs (Private)', isPrivate: true }
];

const DEFAULT_FOLDER_BY_BUCKET: Record<BucketName, string> = {
  assets: 'branding',
  avatars: '',
  'payment-proofs': ''
};

const COMMON_FOLDER_PRESETS: Record<BucketName, string[]> = {
  assets: ['branding', 'hero-banners', 'products', 'categories', 'payments'],
  avatars: [''],
  'payment-proofs': ['']
};

const IMAGE_GUIDE_OPTIONS: Array<{ key: GuideKey; label: string }> = [
  { key: 'none', label: 'No size validation' },
  { key: 'heroBanner', label: 'Hero Banner' },
  { key: 'productPrimary', label: 'Product Primary' },
  { key: 'productGallery', label: 'Product Gallery' },
  { key: 'categoryLogo', label: 'Category Logo' },
  { key: 'paymentLogo', label: 'Payment Logo' },
  { key: 'headerLogo', label: 'Header Logo' },
  { key: 'footerLogo', label: 'Footer Logo' },
  { key: 'favicon', label: 'Favicon' },
  { key: 'linkBar', label: 'Link Bar' }
];

const toFriendlyError = (message?: string) => {
  const text = String(message || 'Unexpected error');
  if (text.includes('Bucket not found')) {
    return 'Storage bucket was not found. Run the latest Supabase schema SQL for this project.';
  }
  if (text.includes('new row violates row-level security') || text.toLowerCase().includes('permission')) {
    return 'Permission denied. You must be logged in as admin to manage this media bucket.';
  }
  return text;
};

const sanitizeFolderPath = (value: string) =>
  value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');

const safeFileName = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf('.');
  const ext = dotIndex > -1 ? fileName.slice(dotIndex + 1).toLowerCase() : 'bin';
  const baseName = (dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)+/g, '');

  return `${baseName || 'file'}.${ext}`;
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const isLikelyImage = (name: string, mimeType: string) =>
  mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name);

const MediaControl: React.FC = () => {
  const [bucket, setBucket] = useState<BucketName>('assets');
  const [folder, setFolder] = useState(DEFAULT_FOLDER_BY_BUCKET.assets);
  const [guideKey, setGuideKey] = useState<GuideKey>('none');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const bucketMeta = BUCKET_OPTIONS.find((item) => item.value === bucket) || BUCKET_OPTIONS[0];
  const selectedGuide = guideKey === 'none' ? null : ADMIN_IMAGE_GUIDES[guideKey];

  const resolveFileUrl = async (item: MediaItem): Promise<string> => {
    if (!bucketMeta.isPrivate) {
      return item.publicUrl;
    }
    const { data, error } = await supabase.storage.from(item.bucket).createSignedUrl(item.path, 60 * 60);
    if (error || !data?.signedUrl) throw new Error(error?.message || 'Failed to generate signed URL.');
    return data.signedUrl;
  };

  const collectFiles = async (bucketName: BucketName, fromFolder: string) => {
    const collected: MediaItem[] = [];
    const normalizedRoot = sanitizeFolderPath(fromFolder);

    const walk = async (prefix: string, depth: number) => {
      const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'updated_at', order: 'desc' }
      });
      if (error) throw error;

      for (const raw of (data || []) as StorageListItem[]) {
        const path = prefix ? `${prefix}/${raw.name}` : raw.name;
        const size = Number(raw.metadata?.size || 0);
        const mimeType = String(raw.metadata?.mimetype || '');
        const hasFileMeta = size > 0 || !!mimeType;
        const isFolder = !hasFileMeta && (raw.id === null || raw.id === undefined);

        if (isFolder) {
          if (depth < 4) {
            await walk(path, depth + 1);
          }
          continue;
        }

        const publicUrl = bucketName === 'payment-proofs'
          ? ''
          : supabase.storage.from(bucketName).getPublicUrl(path).data.publicUrl;

        collected.push({
          bucket: bucketName,
          path,
          name: raw.name,
          updatedAt: raw.updated_at || '',
          sizeBytes: size,
          mimeType,
          isImage: isLikelyImage(raw.name, mimeType),
          publicUrl
        });
      }
    };

    await walk(normalizedRoot, 0);
    return collected.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  };

  const fetchMedia = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const files = await collectFiles(bucket, folder);
      setMediaItems(files);
    } catch (error: any) {
      setMediaItems([]);
      setMessage({ type: 'error', text: toFriendlyError(error?.message || 'Failed to load media.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFolder(DEFAULT_FOLDER_BY_BUCKET[bucket]);
    setGuideKey('none');
    setMessage(null);
  }, [bucket]);

  useEffect(() => {
    fetchMedia();
  }, [bucket, folder]);

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return mediaItems.filter((item) => {
      const matchesSearch = !searchText || item.path.toLowerCase().includes(searchText);
      const matchesType = typeFilter === 'all' || (typeFilter === 'images' ? item.isImage : !item.isImage);
      return matchesSearch && matchesType;
    });
  }, [mediaItems, search, typeFilter]);

  const stats = useMemo(() => {
    const totalSize = filteredItems.reduce((sum, item) => sum + item.sizeBytes, 0);
    const imageCount = filteredItems.filter((item) => item.isImage).length;
    return {
      count: filteredItems.length,
      imageCount,
      otherCount: filteredItems.length - imageCount,
      totalSize
    };
  }, [filteredItems]);

  const handleUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    const normalizedFolder = sanitizeFolderPath(folder);
    let uploadedCount = 0;
    let optimizedCount = 0;
    let reducedBytesTotal = 0;
    const failed: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const isImage = file.type.startsWith('image/');

        if (selectedGuide && !isImage) {
          failed.push(`${file.name}: selected guide requires an image file.`);
          continue;
        }

        if (selectedGuide && isImage) {
          const validation = await validateImageAgainstGuide(file, selectedGuide);
          if (validation.shouldBlock) {
            failed.push(`${file.name}: ${validation.message}`);
            continue;
          }
        }

        let fileToUpload = file;
        if (isImage) {
          const optimized = selectedGuide
            ? await optimizeImageByGuide(file, selectedGuide, { fileNamePrefix: 'media' })
            : await optimizeImageForUpload(file, {
                targetWidth: 1920,
                targetHeight: 1920,
                fit: 'contain',
                maxBytes: 4 * 1024 * 1024,
                fileNamePrefix: 'media'
              });
          fileToUpload = optimized.file;
          optimizedCount += 1;
          reducedBytesTotal += Math.max(0, optimized.originalBytes - optimized.optimizedBytes);
        }

        const finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(fileToUpload.name)}`;
        const path = normalizedFolder ? `${normalizedFolder}/${finalName}` : finalName;
        const { error } = await supabase.storage.from(bucket).upload(path, fileToUpload, { upsert: false });
        if (error) throw error;
        uploadedCount += 1;
      } catch (error: any) {
        failed.push(`${file.name}: ${toFriendlyError(error?.message || 'Upload failed')}`);
      }
    }

    setUploading(false);
    await fetchMedia();

    const optimizationHint =
      optimizedCount > 0 && reducedBytesTotal > 0
        ? ` Optimized ${optimizedCount} image(s), saved ${formatBytes(reducedBytesTotal)}.`
        : '';

    if (failed.length === 0) {
      setMessage({ type: 'success', text: `Uploaded ${uploadedCount} file(s) successfully.${optimizationHint}` });
      return;
    }

    setMessage({
      type: uploadedCount > 0 ? 'success' : 'error',
      text:
        uploadedCount > 0
          ? `Uploaded ${uploadedCount} file(s). ${failed.length} file(s) failed.${optimizationHint}`
          : `Upload failed: ${failed.slice(0, 2).join(' | ')}`
    });
  };

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(`Delete this file?\n${item.path}`)) return;

    setDeletingPath(item.path);
    setMessage(null);
    const { error } = await supabase.storage.from(item.bucket).remove([item.path]);
    setDeletingPath(null);

    if (error) {
      setMessage({ type: 'error', text: toFriendlyError(error.message || 'Delete failed.') });
      return;
    }

    setMessage({ type: 'success', text: 'Media file deleted successfully.' });
    fetchMedia();
  };

  const handleCopyUrl = async (item: MediaItem) => {
    try {
      const url = await resolveFileUrl(item);
      await navigator.clipboard.writeText(url);
      setMessage({ type: 'success', text: 'File URL copied to clipboard.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: toFriendlyError(error?.message || 'Failed to copy URL.') });
    }
  };

  const handleOpen = async (item: MediaItem) => {
    try {
      const url = await resolveFileUrl(item);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      setMessage({ type: 'error', text: toFriendlyError(error?.message || 'Failed to open file.') });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Media Control</h2>
        <p className="text-gray-500 font-medium">
          Upload, validate, organize, preview, and remove media assets from one admin section.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.type === 'error' ? <AlertCircle className="w-4 h-4 mt-0.5" /> : null}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Files</p>
          <p className="text-2xl font-black text-gray-900">{stats.count}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Images</p>
          <p className="text-2xl font-black text-gray-900">{stats.imageCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Other Files</p>
          <p className="text-2xl font-black text-gray-900">{stats.otherCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Size</p>
          <p className="text-2xl font-black text-gray-900">{formatBytes(stats.totalSize)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Upload Center</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Bucket</label>
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as BucketName)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
            >
              {BUCKET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Folder</label>
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. branding, products, hero-banners"
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Validation Profile</label>
            <select
              value={guideKey}
              onChange={(e) => setGuideKey(e.target.value as GuideKey)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
            >
              {IMAGE_GUIDE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {COMMON_FOLDER_PRESETS[bucket].map((preset) => (
            <button
              key={preset || 'root'}
              type="button"
              onClick={() => setFolder(preset)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${sanitizeFolderPath(folder) === sanitizeFolderPath(preset) ? 'bg-accent text-white border-accent shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {preset || 'Root'}
            </button>
          ))}
        </div>

        {selectedGuide && (
          <p className="text-xs text-gray-500">
            {selectedGuide.label} • {formatImageGuideHint(selectedGuide)}
          </p>
        )}

        <label className={`inline-flex items-center gap-2 px-4 h-11 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 cursor-pointer ${uploading ? 'opacity-70 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Choose File(s)'}
          <input
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Media Library</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by file name or path"
                className="h-10 w-full pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold"
              />
            </div>

            <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`h-10 px-3 text-xs font-bold transition-colors ${typeFilter === 'all' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Filter className="w-3.5 h-3.5 inline mr-1" />
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('images')}
                className={`h-10 px-3 text-xs font-bold transition-colors ${typeFilter === 'images' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Images
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('others')}
                className={`h-10 px-3 text-xs font-bold transition-colors ${typeFilter === 'others' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Others
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMedia}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-14 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-sm font-semibold">
            No files found for current bucket/folder/filter.
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Preview</th>
                  <th className="px-4 py-3 text-left">Path</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.path} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {item.isImage && item.publicUrl ? (
                        <img src={item.publicUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 break-all">{item.path}</p>
                      <p className="text-xs text-gray-500">{item.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-600">{item.mimeType || 'unknown'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-700">{formatBytes(item.sizeBytes)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpen(item)}
                          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          title="Open file"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item)}
                          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          title="Copy file URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingPath === item.path}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-60"
                          title="Delete file"
                        >
                          {deletingPath === item.path ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaControl;
