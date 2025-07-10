const AWSXRay = require('aws-xray-sdk');

/**
 * Helper class để quản lý X-Ray annotations và metadata
 */
class XRayHelper {
  /**
   * Thêm metadata cơ bản cho segment
   * @param {Object} segment - X-Ray segment
   * @param {string} operation - Tên operation
   * @param {Object} req - Express request object
   */
  static addBasicMetadata(segment, operation, req) {
    if (!segment) return;
    
    segment.addMetadata('operation', operation);
    segment.addMetadata('timestamp', new Date().toISOString());
    segment.addMetadata('environment', process.env.NODE_ENV || 'development');
    
    if (req) {
      segment.addMetadata('http_method', req.method);
      segment.addMetadata('url', req.originalUrl);
      segment.addMetadata('user_agent', req.get('User-Agent'));
      segment.addMetadata('ip_address', req.ip);
      
      if (req.query && Object.keys(req.query).length > 0) {
        segment.addMetadata('query_params', req.query);
      }
      
      if (req.user) {
        segment.addMetadata('user_id', req.user.userId);
        segment.addMetadata('user_role', req.user.role);
      }
    }
  }

  /**
   * Thêm success annotations
   * @param {Object} segment - X-Ray segment
   * @param {Object} res - Express response object
   * @param {*} result - Kết quả trả về
   */
  static addSuccessAnnotations(segment, res, result) {
    if (!segment) return;
    
    segment.addAnnotation('status', 'success');
    segment.addAnnotation('result_type', typeof result);
    
    if (res && res.statusCode) {
      segment.addMetadata('response_status', res.statusCode);
      segment.addMetadata('response_headers', res.getHeaders());
    }
  }

  /**
   * Thêm error annotations và metadata
   * @param {Object} segment - X-Ray segment
   * @param {Error} error - Error object
   * @param {string} operation - Tên operation
   * @param {Array} args - Arguments của function
   */
  static addErrorAnnotations(segment, error, operation, args = []) {
    if (!segment) return;
    
    segment.addAnnotation('status', 'error');
    segment.addAnnotation('error_type', error.name);
    segment.addAnnotation('error_message', error.message);
    
    segment.addMetadata('error_stack', error.stack);
    segment.addMetadata('error_code', error.code);
    
    segment.addMetadata('error_context', {
      operation,
      timestamp: new Date().toISOString(),
      args_count: args.length
    });
  }

  /**
   * Thêm database operation annotations
   * @param {Object} segment - X-Ray segment
   * @param {string} operation - Database operation (find, count, save, etc.)
   * @param {Object} query - Query object
   * @param {number} resultCount - Số lượng kết quả
   */
  static addDatabaseAnnotations(segment, operation, query = {}, resultCount = null) {
    if (!segment) return;
    
    segment.addAnnotation('db_operation', operation);
    segment.addAnnotation('has_query', !!query && Object.keys(query).length > 0);
    
    if (resultCount !== null) {
      segment.addAnnotation('result_count', resultCount);
    }
    
    if (query && Object.keys(query).length > 0) {
      segment.addMetadata('db_query', query);
    }
  }

  /**
   * Thêm product-specific annotations
   * @param {Object} segment - X-Ray segment
   * @param {Object} product - Product object
   * @param {string} operation - Operation type
   */
  static addProductAnnotations(segment, product, operation) {
    if (!segment) return;
    
    segment.addAnnotation('product_operation', operation);
    
    if (product) {
      segment.addAnnotation('product_id', product._id?.toString());
      segment.addAnnotation('product_name', product.name);
      segment.addAnnotation('product_category', product.category);
      segment.addAnnotation('product_brand', product.brand);
      segment.addAnnotation('product_in_stock', product.inStock);
      
      segment.addMetadata('product_info', {
        id: product._id,
        name: product.name,
        price: product.price,
        category: product.category,
        brand: product.brand,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity
      });
    }
  }

  /**
   * Tạo subsegment với error handling
   * @param {string} name - Tên subsegment
   * @param {Function} fn - Function để execute
   * @returns {Promise} - Promise với kết quả
   */
  static async withSubsegment(name, fn) {
    const segment = AWSXRay.getSegment()?.addNewSubsegment(name);
    
    try {
      const result = await fn(segment);
      segment?.close();
      return result;
    } catch (error) {
      if (segment) {
        this.addErrorAnnotations(segment, error, name);
        segment.close(error);
      }
      throw error;
    }
  }

  /**
   * Thêm performance annotations
   * @param {Object} segment - X-Ray segment
   * @param {number} startTime - Thời gian bắt đầu
   * @param {string} operation - Tên operation
   */
  static addPerformanceAnnotations(segment, startTime, operation) {
    if (!segment) return;
    
    const duration = Date.now() - startTime;
    segment.addAnnotation('operation_duration_ms', duration);
    segment.addAnnotation('operation_name', operation);
    
    // Thêm performance metadata
    segment.addMetadata('performance', {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: duration,
      operation: operation
    });
  }
}

module.exports = XRayHelper; 