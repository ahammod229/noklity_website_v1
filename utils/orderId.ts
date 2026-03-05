const ORDER_ID_LENGTH = 13;
const ORDER_ID_MODULO = 10n ** 13n;
const FNV_OFFSET_BASIS_64 = 1469598103934665603n;
const FNV_PRIME_64 = 1099511628211n;
const FNV_MASK_64 = (1n << 64n) - 1n;

/**
 * Converts internal order UUID/string into a stable 13-digit customer/admin display ID.
 * This keeps DB IDs unchanged while presenting a shorter readable identifier.
 */
export const getShortOrderId = (orderId: string | null | undefined): string => {
  const value = String(orderId || '').trim();
  if (!value) {
    return ''.padStart(ORDER_ID_LENGTH, '0');
  }

  const numericOnly = value.replace(/\D/g, '');
  if (numericOnly.length === ORDER_ID_LENGTH) {
    return numericOnly;
  }

  let hash = FNV_OFFSET_BASIS_64;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = (hash * FNV_PRIME_64) & FNV_MASK_64;
  }

  return (hash % ORDER_ID_MODULO).toString().padStart(ORDER_ID_LENGTH, '0');
};

export const formatShortOrderId = (orderId: string | null | undefined) => `#${getShortOrderId(orderId)}`;
