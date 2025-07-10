const AWSXRay = require('aws-xray-sdk');
const Product = require('../models/Product');
const User = require('../models/User'); // Giả định bạn có model User
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// Helper function để xử lý X-Ray segment an toàn với annotations và metadata
const withXRay = (segmentName, fn) => async (...args) => {
  const segment = process.env.ENABLE_XRAY === 'true'
    ? AWSXRay.getSegment()?.addNewSubsegment(segmentName)
    : null;

  try {
    // Thêm metadata cơ bản
    if (segment) {
      segment.addMetadata('operation', segmentName);
      segment.addMetadata('timestamp', new Date().toISOString());
      segment.addMetadata('environment', process.env.NODE_ENV || 'development');

      // Thêm request info nếu có
      if (args.length > 0 && args[0] && args[0].method) {
        const req = args[0];
        segment.addMetadata('http_method', req.method);
        segment.addMetadata('url', req.originalUrl);
        segment.addMetadata('user_agent', req.get('User-Agent'));
        segment.addMetadata('ip_address', req.ip);

        // Thêm query parameters
        if (req.query && Object.keys(req.query).length > 0) {
          segment.addMetadata('query_params', req.query);
        }

        // Thêm user info nếu có
        if (req.user) {
          segment.addAnnotation('user_id', req.user.userId || 'unknown');
          segment.addMetadata('user_role', req.user.role || 'unknown');
        }
      }
    }

    const result = await fn(...args);

    // Thêm success annotation
    if (segment) {
      segment.addAnnotation('status', 'success');
      segment.addAnnotation('result_type', typeof result);

      // Thêm response metadata
      if (args.length > 1 && args[1] && args[1].statusCode) {
        const res = args[1];
        segment.addMetadata('response_status', res.statusCode);
        segment.addMetadata('response_headers', res.getHeaders());
      }
    }

    segment?.close();
    return result;
  } catch (err) {
    // Thêm error annotations và metadata
    if (segment) {
      segment.addAnnotation('status', 'error');
      segment.addAnnotation('error_type', err.name);
      segment.addAnnotation('error_message', err.message);

      segment.addMetadata('error_stack', err.stack);
      segment.addMetadata('error_code', err.code);

      // Thêm context info cho lỗi
      segment.addMetadata('error_context', {
        operation: segmentName,
        timestamp: new Date().toISOString(),
        args_count: args.length
      });
    }

    segment?.close(err);
    throw err;
  }
};

exports.getProducts = withXRay('GetProducts', async (req, res) => {
  const { category, brand, sort, page = 1, limit = 10 } = req.query;
  let query = {};

  // Thêm annotations cho query parameters
  const segment = AWSXRay.getSegment()?.addNewSubsegment('BuildQuery');
  if (segment) {
    segment.addAnnotation('category', category || 'all');
    segment.addAnnotation('brand', brand || 'all');
    segment.addAnnotation('sort', sort || 'default');
    segment.addAnnotation('page', parseInt(page));
    segment.addAnnotation('limit', parseInt(limit));
    segment.addMetadata('query_params', { category, brand, sort, page, limit });
  }

  if (category && category !== 'all') {
    query.category = new RegExp(`^${category}$`, 'i');
  }

  if (brand && brand !== 'all') {
    query.brand = new RegExp(`^${brand}$`, 'i');
  }

  let sortOption = {};
  if (sort === 'price-low') {
    sortOption.price = 1;
  } else if (sort === 'price-high') {
    sortOption.price = -1;
  } else if (sort === 'rating') {
    sortOption.rating = -1;
  }

  segment?.close();

  // Thêm subsegment cho database operations
  const dbSegment = AWSXRay.getSegment()?.addNewSubsegment('DatabaseOperations');
  try {
    const totalCount = await Product.countDocuments(query);
    const deletedCount = await Product.countDocuments({ ...query, isDeleted: true });

    // Tối ưu categoryCounts bằng aggregation
    const categoryCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } }
    ]).then(results => {
      const counts = { all: 0 };
      results.forEach(r => {
        counts[r.category.toLowerCase()] = r.count;
        counts.all += r.count;
      });
      return counts;
    });

    const products = await Product.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    if (dbSegment) {
      dbSegment.addAnnotation('total_count', totalCount);
      dbSegment.addAnnotation('deleted_count', deletedCount);
      dbSegment.addAnnotation('products_found', products.length);
      dbSegment.addMetadata('query_filter', query);
      dbSegment.addMetadata('category_counts', categoryCounts);
      dbSegment.addMetadata('products_sample', products.slice(0, 3).map(p => ({
        id: p._id,
        name: p.name,
        price: p.price
      })));
    }

    dbSegment?.close();

    // Thêm response metadata
    const responseData = {
      products,
      totalCount: totalCount || 0,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      categoryCounts
    };

    const responseSegment = AWSXRay.getSegment()?.addNewSubsegment('BuildResponse');
    if (responseSegment) {
      responseSegment.addAnnotation('response_products_count', products.length);
      responseSegment.addAnnotation('response_total_pages', Math.ceil(totalCount / limit));
      responseSegment.addAnnotation('response_current_page', parseInt(page));
      responseSegment.addMetadata('response_data', responseData);
    }
    responseSegment?.close();

    res.status(200).json(responseData);
  } catch (error) {
    if (dbSegment) {
      dbSegment.addAnnotation('db_error', true);
      dbSegment.addMetadata('db_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      dbSegment.close(error);
    }
    throw error;
  }
});

exports.getProductById = withXRay('GetProductById', async (req, res) => {
  console.log(`Fetching product with ID: ${req.params.id}`);
  const lookupSegment = AWSXRay.getSegment()?.addNewSubsegment('ProductLookup');
  if (lookupSegment) {
    lookupSegment.addAnnotation('product_id', req.params.id);
    lookupSegment.addMetadata('request_params', req.params);
  }

  try {
    const product = await Product.findById(req.params.id).lean();

    if (lookupSegment) {
      lookupSegment.addAnnotation('product_found', !!product);
      if (product) {
        lookupSegment.addMetadata('product_info', {
          id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          brand: product.brand,
          inStock: product.inStock
        });
      }
    }

    if (!product) {
      if (lookupSegment) {
        lookupSegment.addAnnotation('error_type', 'product_not_found');
        lookupSegment.addMetadata('error_details', {
          message: 'Sản phẩm không tồn tại',
          requested_id: req.params.id
        });
      }
      lookupSegment?.close();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    lookupSegment?.close();
    res.status(200).json(product);
  } catch (error) {
    if (lookupSegment) {
      lookupSegment.addAnnotation('error_type', 'database_error');
      lookupSegment.addMetadata('error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      lookupSegment.close(error);
    }
    throw error;
  }
});

exports.createProduct = withXRay('CreateProduct', async (req, res) => {
  const dbSegment = AWSXRay.getSegment()?.addNewSubsegment('DatabaseOperations');
  try {
    const { name, price, image, category, brand, specs, stockQuantity, warranty, storage, display, os, battery, weight, featuresDescription, description, sku } = req.body;

    if (!name || !price || !image || !category || !brand || !sku) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm' });
    }

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'SKU đã tồn tại' });
    }

    const product = new Product({
      name,
      price,
      image,
      category,
      brand,
      specs: specs || [],
      stockQuantity: stockQuantity || 0,
      warranty: warranty || '24 tháng',
      storage: storage || '',
      display: display || '',
      os: os || '',
      battery: battery || '',
      weight: weight || '',
      featuresDescription: featuresDescription || '',
      description: description || '',
      sku,
      rating: 0,
      reviews: 0,
      inStock: (stockQuantity || 0) > 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await product.save();

    if (dbSegment) {
      dbSegment.addAnnotation('product_created', true);
      dbSegment.addMetadata('product_info', {
        id: product._id,
        name,
        sku,
        image,
        price,
        category
      });
    }

    dbSegment?.close();
    res.status(201).json(product);
  } catch (error) {
    if (dbSegment) {
      dbSegment.addAnnotation('db_error', true);
      dbSegment.addMetadata('db_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      dbSegment.close(error);
    }
    throw error;
  }
});

exports.updateProduct = withXRay('UpdateProduct', async (req, res) => {
  console.log(`Updating product ID: ${req.params.id} with data: ${JSON.stringify(req.body)}`);
  const { id } = req.params;
  const dbSegment = AWSXRay.getSegment()?.addNewSubsegment('DatabaseOperations');

  try {
    const { name, price, image, category, brand, specs, stockQuantity, warranty, storage, display, os, battery, weight, featuresDescription, description, sku } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (sku && sku !== product.sku) {
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return res.status(400).json({ message: 'SKU đã tồn tại' });
      }
    }

    product.name = name !== undefined ? name : product.name;
    product.price = price !== undefined ? price : product.price;
    product.image = image !== undefined ? image : product.image;
    product.category = category !== undefined ? category : product.category;
    product.brand = brand !== undefined ? brand : product.brand;
    product.specs = specs !== undefined ? specs : product.specs;
    product.stockQuantity = stockQuantity !== undefined ? stockQuantity : product.stockQuantity;
    product.warranty = warranty !== undefined ? warranty : product.warranty;
    product.storage = storage !== undefined ? storage : product.storage;
    product.display = display !== undefined ? display : product.display;
    product.os = os !== undefined ? os : product.os;
    product.battery = battery !== undefined ? battery : product.battery;
    product.weight = weight !== undefined ? weight : product.weight;
    product.featuresDescription = featuresDescription !== undefined ? featuresDescription : product.featuresDescription;
    product.description = description !== undefined ? description : product.description;
    product.sku = sku !== undefined ? sku : product.sku;
    product.inStock = (stockQuantity !== undefined ? stockQuantity : product.stockQuantity) > 0;
    product.updatedAt = new Date();

    await product.save();

    if (dbSegment) {
      dbSegment.addAnnotation('product_updated', true);
      dbSegment.addMetadata('product_info', {
        id: product._id,
        name: product.name,
        sku: product.sku,
        image: product.image
      });
    }

    dbSegment?.close();
    res.status(200).json(product);
  } catch (error) {
    if (dbSegment) {
      dbSegment.addAnnotation('db_error', true);
      dbSegment.addMetadata('db_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      dbSegment.close(error);
    }
    throw error;
  }
});

exports.deleteProduct = withXRay('DeleteProduct', async (req, res) => {
  console.log(`Deleting product with ID: ${req.params.id}`);
  const { id } = req.params;
  const dbSegment = AWSXRay.getSegment()?.addNewSubsegment('DatabaseOperations');

  try {
    const product = await Product.findById(id);
    if (!product) {
      if (dbSegment) {
        dbSegment.addAnnotation('product_found', false);
        dbSegment.addMetadata('error_details', {
          message: 'Sản phẩm không tồn tại',
          requested_id: id
        });
      }
      dbSegment?.close();
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Thay vì xóa cứng, đánh dấu isDeleted: true (nếu dùng soft delete)
    product.isDeleted = true;
    await product.save();

    if (dbSegment) {
      dbSegment.addAnnotation('product_deleted', true);
      dbSegment.addMetadata('product_info', {
        id: product._id,
        name: product.name,
        sku: product.sku
      });
    }

    dbSegment?.close();
    res.status(200).json({ message: 'Sản phẩm đã được xóa' });
  } catch (error) {
    if (dbSegment) {
      dbSegment.addAnnotation('db_error', true);
      dbSegment.addMetadata('db_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      dbSegment.close(error);
    }
    throw error;
  }
});

exports.addReview = withXRay('AddReview', async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.userId;
  const dbSegment = AWSXRay.getSegment()?.addNewSubsegment('DatabaseOperations');

  try {
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const alreadyReviewed = product.reviewsData.find(r => r.userId.toString() === userId);
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này' });
    }

    const user = await User.findById(userId);
    const review = {
      userId,
      name: user.name || 'Người dùng',
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };

    product.reviewsData.push(review);
    product.updateRating(); // Giả định hàm updateRating tồn tại trong schema
    await product.save();

    if (dbSegment) {
      dbSegment.addAnnotation('review_added', true);
      dbSegment.addMetadata('review_info', {
        productId: product._id,
        userId,
        rating,
        comment
      });
    }

    dbSegment?.close();
    res.status(201).json({ message: 'Đánh giá thành công', review });
  } catch (error) {
    if (dbSegment) {
      dbSegment.addAnnotation('db_error', true);
      dbSegment.addMetadata('db_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      dbSegment.close(error);
    }
    throw error;
  }
});

exports.getReviewsForProduct = withXRay('GetReviewsForProduct', async (req, res) => {
  const { productId } = req.params;
  const dbSegment = AWSXRay.getSegment()?.addNewSubsegment('DatabaseOperations');

  try {
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const reviews = product.reviewsData.sort((a, b) => b.createdAt - a.createdAt);

    if (dbSegment) {
      dbSegment.addAnnotation('reviews_found', reviews.length);
      dbSegment.addMetadata('reviews_sample', reviews.slice(0, 3).map(r => ({
        userId: r.userId,
        rating: r.rating,
        comment: r.comment
      })));
    }

    dbSegment?.close();
    res.status(200).json(reviews);
  } catch (error) {
    if (dbSegment) {
      dbSegment.addAnnotation('db_error', true);
      dbSegment.addMetadata('db_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      dbSegment.close(error);
    }
    throw error;
  }
});

exports.searchProducts = withXRay('SearchProducts', async (req, res) => {
  const q = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const validationSegment = AWSXRay.getSegment()?.addNewSubsegment('SearchValidation');

  if (validationSegment) {
    validationSegment.addAnnotation('search_query', q || 'none');
    validationSegment.addAnnotation('query_type', typeof q);
    validationSegment.addAnnotation('is_array', Array.isArray(req.query.q));
    validationSegment.addMetadata('raw_query', req.query.q);
  }

  if (!q || typeof q !== 'string' || q.trim() === '') {
    console.warn('Invalid search query received:', q);
    if (validationSegment) {
      validationSegment.addAnnotation('validation_failed', true);
      validationSegment.addAnnotation('error_reason', 'invalid_query');
      validationSegment.addMetadata('error_details', {
        message: 'Thiếu hoặc không hợp lệ từ khóa tìm kiếm',
        query: q,
        queryType: typeof q
      });
    }
    validationSegment?.close();
    return res.status(400).json({ message: 'Thiếu hoặc không hợp lệ từ khóa tìm kiếm' });
  }

  validationSegment?.close();

  const searchSegment = AWSXRay.getSegment()?.addNewSubsegment('SearchExecution');
  if (searchSegment) {
    searchSegment.addAnnotation('search_term', q.trim());
    searchSegment.addAnnotation('search_limit', 5);
    searchSegment.addMetadata('search_criteria', {
      field: 'name',
      regex: q.trim(),
      options: 'i'
    });
  }

  try {
    const results = await Product.find({
      name: { $regex: q.trim(), $options: 'i' }
    })
      .limit(5)
      .select('name')
      .lean();

    if (searchSegment) {
      searchSegment.addAnnotation('results_count', results.length);
      searchSegment.addMetadata('search_results', results.map(r => ({
        id: r._id,
        name: r.name
      })));
    }

    const suggestions = results.map((product) => product.name).filter(name => name && typeof name === 'string');

    if (searchSegment) {
      searchSegment.addAnnotation('suggestions_count', suggestions.length);
      searchSegment.addMetadata('final_suggestions', suggestions);
    }

    console.log('Processed suggestions:', suggestions);
    searchSegment?.close();
    res.json(suggestions);
  } catch (error) {
    if (searchSegment) {
      searchSegment.addAnnotation('search_error', true);
      searchSegment.addMetadata('search_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      searchSegment.close(error);
    }
    throw error;
  }
});

exports.uploadProductImage = withXRay('UploadProductImage', async (req, res) => {
  const fileSegment = AWSXRay.getSegment()?.addNewSubsegment('FileValidation');
  if (fileSegment) {
    fileSegment.addAnnotation('has_file', !!req.file);
    if (req.file) {
      fileSegment.addAnnotation('file_size', req.file.size);
      fileSegment.addAnnotation('file_mimetype', req.file.mimetype);
      fileSegment.addMetadata('file_info', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        encoding: req.file.encoding
      });
    }
  }

  if (!req.file) {
    if (fileSegment) {
      fileSegment.addAnnotation('validation_failed', true);
      fileSegment.addAnnotation('error_reason', 'no_file');
      fileSegment.addMetadata('error_details', {
        message: 'Không có file được upload'
      });
    }
    fileSegment?.close();
    return res.status(400).json({ message: 'Không có file được upload' });
  }

  fileSegment?.close();

  const s3Segment = AWSXRay.getSegment()?.addNewSubsegment('S3Upload');
  if (s3Segment) {
    s3Segment.addAnnotation('bucket_name', 'ecommerce-products-2025');
    s3Segment.addAnnotation('region', process.env.AWS_REGION || 'ap-southeast-1');
    s3Segment.addAnnotation('cloudtrail_correlation_id', `s3-${Date.now()}`);
    s3Segment.addMetadata('s3_params', {
      bucket: 'ecommerce-products-2025',
      key: `products/${Date.now()}-${req.file.originalname}`,
      contentType: req.file.mimetype
    });
  }

  try {
    const params = {
      Bucket: 'ecommerce-products-2025',
      Key: `products/${Date.now()}-${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
      // Bỏ ACL: 'public-read', dùng Bucket Policy
    };

    await s3Client.send(new PutObjectCommand(params));

    const imageUrl = `https://ecommerce-products-2025.s3.ap-southeast-1.amazonaws.com/${params.Key}`;

    if (s3Segment) {
      s3Segment.addAnnotation('upload_success', true);
      s3Segment.addAnnotation('image_url', imageUrl);
      s3Segment.addMetadata('upload_result', {
        imageUrl,
        key: params.Key,
        bucket: params.Bucket
      });
    }

    s3Segment?.close();
    res.status(200).json({ imageUrl });
  } catch (error) {
    if (s3Segment) {
      s3Segment.addAnnotation('upload_error', true);
      s3Segment.addAnnotation('error_type', error.name);
      s3Segment.addMetadata('upload_error_details', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        s3Error: error.$metadata
      });
      s3Segment.close(error);
    }
    throw error;
  }
});