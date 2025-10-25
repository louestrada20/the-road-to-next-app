import { stripe } from "@/lib/stripe";

/**
 * Retrieves the allowedMembers limit from a Stripe product's metadata
 * Returns 1 if product doesn't exist or has no metadata
 * 
 * @param productId - Stripe product ID
 * @returns Number of allowed members for this product
 */
export async function getProductMemberLimit(productId: string | null | undefined): Promise<number> {
  if (!productId) {
    return 1; // Default for no subscription
  }

  try {
    const product = await stripe.products.retrieve(productId);
    const allowedMembers = product.metadata?.allowedMembers;

    if (!allowedMembers) {
      console.warn(`Product ${productId} has no allowedMembers metadata. Defaulting to 1.`);
      return 1;
    }

    const parsed = Number(allowedMembers);
    if (isNaN(parsed) || parsed < 1) {
      console.warn(`Product ${productId} has invalid allowedMembers: ${allowedMembers}. Defaulting to 1.`);
      return 1;
    }

    return parsed;
  } catch (error) {
    console.error(`Failed to retrieve product ${productId}:`, error);
    return 1; // Fail safe to minimum
  }
}

/**
 * Compares two product IDs to determine if this is a downgrade (fewer members allowed)
 * Returns null if unable to determine
 */
export async function isDowngrade(
  oldProductId: string | null | undefined,
  newProductId: string | null | undefined
): Promise<{ isDowngrade: boolean; oldLimit: number; newLimit: number } | null> {
  if (!oldProductId || !newProductId) {
    return null;
  }

  if (oldProductId === newProductId) {
    return null; // Same product, no change
  }

  const [oldLimit, newLimit] = await Promise.all([
    getProductMemberLimit(oldProductId),
    getProductMemberLimit(newProductId),
  ]);

  return {
    isDowngrade: newLimit < oldLimit,
    oldLimit,
    newLimit,
  };
}

