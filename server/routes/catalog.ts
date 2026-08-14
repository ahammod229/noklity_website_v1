import { Router } from 'express';
import { ProductModel } from '../models/Product';
import { mapCatalogProduct } from '../utils/catalogMapper';

const router = Router();

const VISIBLE_PRODUCT_FILTER = {
  isActive: { $ne: false },
  status: { $ne: 'inactive' }
};

router.get('/products/flash-sale', async (_req, res, next) => {
  try {
    const products = await ProductModel.find({
      ...VISIBLE_PRODUCT_FILTER,
      isFlashSale: true
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      data: products.map(mapCatalogProduct),
      meta: {
        count: products.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findOne({
      ...VISIBLE_PRODUCT_FILTER,
      $or: [{ productId: id }, { slug: id }]
    }).lean();

    if (!product) {
      res.status(404).json({
        message: 'Product not found.'
      });
      return;
    }

    res.status(200).json({
      data: mapCatalogProduct(product)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const category = String(req.query.category || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 100);

    const filter: Record<string, unknown> = {
      ...VISIBLE_PRODUCT_FILTER
    };

    if (category) {
      filter.category = category;
    }

    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({
      data: products.map(mapCatalogProduct),
      meta: {
        count: products.length,
        category: category || null
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
